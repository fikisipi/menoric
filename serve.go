package main

import (
	"context"
	"errors"
	"fmt"
	"go.mongodb.org/mongo-driver/bson"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "embed"
	"github.com/alexedwards/argon2id"
	"github.com/google/uuid"
	graphql "github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Resolver struct{}
type UserResolver struct{ Id graphql.ID }

func (u UserResolver) getDoc() (bson.D, error) {
	r := db.Collection("users").FindOne(context.Background(), bson.M{"userId": u.Id})
	if r.Err() != nil {
		return nil, r.Err()
	}
	var doc bson.D
	r.Decode(&doc)
	return doc, nil
}

func (u UserResolver) Username() (string, error) {
	usr, err := findUser(&u.Id, nil)
	if err != nil {
		return "", err
	}
	return usr.Username, nil
}

func (u UserResolver) Messages() (*[]MessageResolver, error) {
	usr, err := findUser(&u.Id, nil)
	if err != nil {
		return nil, err
	}
	m := usr.MessageResolver()
	return &m, nil
}

func (u UserResolver) Followers() *[]UserResolver {
	r := db.Collection("users").FindOne(context.Background(), bson.M{"userId": string(u.Id)})
	var U struct {
		Followers []string `bson:"followers"`
		Following []string `bson:"following"`
	}
	r.Decode(&U)
	var resolvers = []UserResolver{}
	for _, follower := range U.Followers {
		resolvers = append(resolvers, UserResolver{graphql.ID(follower)})
	}
	return &resolvers
}

func (u UserResolver) Bio() string {
	usr, err := findUser(&u.Id, nil)
	if err != nil {
		return ""
	}
	return usr.Bio
}

func (u UserResolver) Following() *[]UserResolver {
	r := db.Collection("users").FindOne(context.Background(), bson.M{"userId": string(u.Id)})
	var U struct {
		Followers []string `bson:"followers"`
		Following []string `bson:"following"`
	}
	r.Decode(&U)
	var resolvers = []UserResolver{}
	for _, follower := range U.Following {
		resolvers = append(resolvers, UserResolver{graphql.ID(follower)})
	}
	return &resolvers
}

type MessageResolver struct {
	userId  string     `bson:"userId"`
	Id      graphql.ID `bson:"id"`
	Message string     `bson:"message"`
	Time    string     `bson:"time"`
}

func (m MessageResolver) Likes() []UserResolver {
	return make([]UserResolver, 0)
}

func (m MessageResolver) User() UserResolver {
	return UserResolver{graphql.ID(m.userId)}
}

var client, _ = mongo.Connect(context.Background(), options.Client().ApplyURI(os.Getenv("MONGO_URL")))
var db = client.Database("main")

func (r Resolver) GetUser(args struct{ Username string }) (*UserResolver, error) {
	rr := db.Collection("users").FindOne(context.Background(), bson.M{"username": args.Username})
	if rr.Err() != nil {
		return nil, rr.Err()
	}
	var Res struct {
		UserId string `bson:"userId"`
	}
	rr.Decode(&Res)

	return &UserResolver{Id: graphql.ID(Res.UserId)}, nil
}

func (r Resolver) GetTimeline(args struct{ UserId graphql.ID }) (*[]MessageResolver, error) {
	u, err := findUser(&args.UserId, nil)
	if err != nil {
		return nil, err
	}

	u.Following = append(u.Following, string(args.UserId))

	c, _ := db.Collection("users").Find(context.Background(), bson.M{"userId": bson.M{"$in": u.Following}})
	results := make([]UserDocument, 0)

	err = c.All(context.Background(), &results)
	if err != nil {
		return nil, err
	}

	msgs := make([]MessageResolver, 0)
	for _, user := range results {
		msgs = append(msgs, user.MessageResolver()...)
	}
	return &msgs, nil
}

func (r Resolver) TopMessages() *[]MessageResolver {
	username := "fikisipi"
	usr, _ := findUser(nil, &username)
	res := usr.MessageResolver()
	return &res
}

type TokenResolver struct {
	Token  string
	UserId graphql.ID
}

func (t TokenResolver) User() UserResolver {
	return UserResolver{Id: t.UserId}
}

func genId() string {
	return uuid.New().String()
}

func genHash(pw string) string {
	h, err := argon2id.CreateHash(pw, argon2id.DefaultParams)
	if err != nil {
		panic(err)
	}
	return h
}

func checkHash(pw string, hash string) bool {
	res, _, err := argon2id.CheckHash(pw, hash)
	if err != nil {
		panic(err)
	}
	return res
}

type UserDocument struct {
	Id           string            `bson:"userId"`
	Messages     []MessageResolver `bson:"messages"`
	Followers    []string          `bson:"followers"`
	Following    []string          `bson:"following"`
	Username     string            `bson:"username"`
	Email        string            `bson:"email"`
	PasswordHash string            `bson:"passwordHash"`
	Token        string            `bson:"token"`
	Bio          string            `bson:"bio"`
}

func (u UserDocument) MessageResolver() []MessageResolver {
	resolvers := make([]MessageResolver, 0)
	for _, message := range u.Messages {
		resolvers = append(resolvers, MessageResolver{
			userId:  u.Id,
			Message: message.Message,
			Time:    message.Time,
		})
	}
	return resolvers
}

func (r Resolver) Signup(args struct {
	Username string
	Email    string
	Password string
}) (*TokenResolver, error) {
	//_, err := findUser(nil, &args.Username)
	//if err == nil {
	//	return nil, errors.New("username exists")
	//}
	if len(args.Username) < 1 {
		return nil, errors.New("too short username")
	}
	if !strings.Contains(args.Email, "@") {
		return nil, errors.New("invalid email")
	}
	if len(args.Password) < 5 {
		return nil, errors.New("password too short")
	}

	var d UserDocument
	d.Id = genId()
	d.Username = args.Username
	d.PasswordHash = genHash(args.Password)
	d.Email = args.Email
	d.Token = genId()
	d.Messages = make([]MessageResolver, 0)
	d.Followers = make([]string, 0)
	d.Following = make([]string, 0)

	_, err := db.Collection("users").InsertOne(context.Background(), &d)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			return nil, errors.New("username or email already exists")
		}
		return nil, err
	}
	return &TokenResolver{Token: d.Token, UserId: graphql.ID(d.Id)}, nil
}

func (r Resolver) Login(args struct {
	Username string
	Password string
}) (*TokenResolver, error) {
	res := db.Collection("users").FindOne(context.Background(), bson.M{"username": args.Username})
	if res.Err() != nil {
		if strings.Contains(res.Err().Error(), "no documents") {
			return nil, errors.New("Invalid username/password")
		}
		return nil, res.Err()
	}
	var Pw struct {
		UserId       string `bson:"userId"`
		Token        string `bson:"token"`
		PasswordHash string `bson:"passwordHash"`
	}
	res.Decode(&Pw)
	h := checkHash(args.Password, Pw.PasswordHash)
	if !h {
		return nil, errors.New("invalid pw")
	}
	return &TokenResolver{Token: Pw.Token, UserId: graphql.ID(Pw.UserId)}, nil
}

func findUser(id *graphql.ID, username *string) (*UserDocument, error) {
	var criteria = bson.M{}
	if id != nil {
		criteria["userId"] = string(*id)
	}
	if username != nil {
		criteria["username"] = string(*username)
	}
	res := db.Collection("users").FindOne(context.Background(), criteria)
	if res.Err() != nil {
		return nil, res.Err()
	}
	var U UserDocument
	res.Decode(&U)
	return &U, nil
}

func (r Resolver) Follow(args struct {
	Token string
	To    graphql.ID
}) (string, error) {
	user, err := userByToken(args.Token)
	if err != nil {
		return "", err
	}

	user2, err := findUser(&args.To, nil)
	if err != nil {
		return "", err
	}

	rr, err := db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user.Id}, bson.M{"$addToSet": bson.M{"following": user2.Id}})
	if err != nil {
		return "", err
	}
	rr2, err := db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user2.Id}, bson.M{"$addToSet": bson.M{"followers": user.Id}})
	return strconv.FormatInt(rr.ModifiedCount+rr2.ModifiedCount, 10), nil
}

func (r Resolver) Unfollow(args struct {
	Token string
	To    graphql.ID
}) (string, error) {
	user, err := userByToken(args.Token)
	if err != nil {
		return "", err
	}

	user2, err := findUser(&args.To, nil)
	if err != nil {
		return "", err
	}

	rr, err := db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user.Id}, bson.M{"$pull": bson.M{"following": user2.Id}})
	if err != nil {
		return "", err
	}
	rr2, err := db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user2.Id}, bson.M{"$pull": bson.M{"followers": user.Id}})
	return strconv.FormatInt(rr.ModifiedCount+rr2.ModifiedCount, 10), nil
}

func (r Resolver) NewMessage(args struct {
	Token   string
	Message string
}) (*MessageResolver, error) {
	user, err := userByToken(args.Token)
	if err != nil {
		return nil, err
	}

	m := MessageResolver{
		userId:  user.Id,
		Id:      graphql.ID(genId()),
		Message: args.Message,
		Time:    time.Now().Format(time.RFC3339),
	}
	rr, err := db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user.Id}, bson.M{"$push": bson.M{"messages": m}})
	if err != nil {
		return nil, err
	}
	_ = rr
	return &m, nil
}

func (r Resolver) SetBio(args struct {
	Token string
	Bio   string
}) (string, error) {
	user, err := userByToken(args.Token)
	if err != nil {
		return "", err
	}

	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"userId": user.Id}, bson.M{"$set": bson.M{"bio": args.Bio}})
	if err != nil {
		return "", err
	}
	return args.Bio, nil
}

func (r Resolver) LoginToken(args struct{ Token string }) (*TokenResolver, error) {
	user, err := userByToken(args.Token)
	if err != nil {
		return nil, err
	}
	tokRes := TokenResolver{
		Token:  user.Token,
		UserId: graphql.ID(user.Id),
	}
	return &tokRes, nil
}

func userByToken(token string) (*UserDocument, error) {
	col := db.Collection("users").FindOne(context.Background(), bson.M{"token": token})
	if col.Err() != nil {
		return nil, col.Err()
	}
	var user UserDocument
	col.Decode(&user)
	return &user, nil
}

//go:embed schema.gql
var s string

func newRelay() relay.Handler {
	opts := []graphql.SchemaOpt{graphql.UseFieldResolvers()}
	schema := graphql.MustParseSchema(s, &Resolver{}, opts...)
	return relay.Handler{schema}
}

func createIndexes() {
	opts := options.Index()
	opts.SetUnique(true)
	db.Collection("users").Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{"username", -1}},
		Options: opts,
	})

	db.Collection("users").Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{"email", -1}},
		Options: opts,
	})

	db.Collection("users").Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{"token", -1}},
		Options: opts,
	})

	db.Collection("users").Indexes().CreateOne(context.Background(), mongo.IndexModel{
		Keys:    bson.D{{"", -1}},
		Options: nil,
	})
}

func main() {
	R := newRelay()
	http.HandleFunc("/dr0p", func(writer http.ResponseWriter, request *http.Request) {
		err := db.Collection("users").Drop(context.Background())
		createIndexes()
		if err != nil {
			writer.WriteHeader(500)
			writer.Write([]byte(err.Error()))
		} else {
			writer.Write([]byte(`Successfully deleted the whole collection`))
		}
	})

	http.HandleFunc("/query", func(writer http.ResponseWriter, request *http.Request) {
		writer.Header().Set("Access-Control-Allow-Origin", "*")
		R.ServeHTTP(writer, request)
	})
	http.HandleFunc("/check", func(writer http.ResponseWriter, request *http.Request) {
		createIndexes()
		writer.WriteHeader(200)
		writer.Write([]byte(`up`))
	})

	fmt.Println("http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
