export const ENDPOINT = "https://backend-production-a9d0.up.railway.app/query"
import {
    Token,
    Mutation,
    MutationSignupArgs,
    MutationLoginArgs,
    MutationLoginTokenArgs,
    MutationNewMessageArgs, QueryGetTimelineArgs, Query, QueryGetUserArgs, MutationFollowArgs
} from "./gql/graphql"
export type {Token, User, Message} from "./gql/graphql"

type DataOrError<T> = {data: T, errors: never} | {data: never, errors: any[]}
type Fn<Args, Res> = (args: Args) => Promise<DataOrError<Res>>

type Signup = Fn<MutationSignupArgs, Mutation["signup"]>
type GetUser = Fn<QueryGetUserArgs, Query["getUser"]>
type Login = Fn<MutationLoginArgs, Mutation["login"]>
type LoginToken = Fn<MutationLoginTokenArgs, Mutation["loginToken"]>
type NewMsg = Fn<MutationNewMessageArgs, Mutation["newMessage"]>
type GetTimeline = Fn<QueryGetTimelineArgs, Query["getTimeline"]>
type Follow = Fn<MutationFollowArgs, Mutation["follow"]>

export async function gql<T>(query: string, queryName: string, vars?: object) : Promise<DataOrError<T>> {
    let b = await fetch(ENDPOINT, {
        method: "POST",
        body: JSON.stringify({query: query, variables: vars || undefined})
    })
    if(!b.ok) {
        //@ts-ignore
        return {errors: [{message: "Error contacting API"}]}
    }
    let j = await b.json() as {errors?: any[], data: Record<string, T>}
    if(j.errors) {
        //@ts-ignore
        return {errors: j.errors}
    } else {
        //@ts-ignore
        return {data: j.data[queryName]}
    }
}

class ApiError extends Error {
    data: object;
    constructor(data: object) {
        super(JSON.stringify(data));
        this.data = data;
    }
}

export const signup: Signup = async (obj) => {
    return await gql<Token>(`
    mutation($username: String!, $email: String!, $password: String!) {
        signup(username: $username, email: $email, password: $password) {
            token
            user {
                id
                username
            }
        }
    }
    `, `signup`, obj)
}

export const login: Login = async (obj) => {
    return await gql<Token>(`
    mutation($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            token
            user {
                id
                username
            }
        }
    }
    `, `login`, obj)
}

export const loginToken: LoginToken = async (obj) => {
    return await gql(`
    mutation($token: String!) {
        loginToken(token: $token) {
            token
            user {
                id
                username
                following {
                    id
                    username
                }
                followers {
                    id
                    username
                }
            }
        }
    }
    `, `loginToken`, obj)
}

export const getTimeline: GetTimeline = async(obj) => {
    return await gql(`
    query($userId: ID!) {
        getTimeline(userId: $userId) {
            id
            message
            time
            user {
                id
                username
            }
        }
    }
    `, `getTimeline`, obj)
}

export const newMessage: NewMsg = async(obj) => {
    return await gql(`
    mutation($token: String!, $message: String!) {
        newMessage(token: $token, message: $message) {
            id
            message
            time
        }
    }
    `, `newMessage`, obj)
}

export const getUser: GetUser = async(obj) => {
    return await gql(`
    query($username: String!) {
        getUser(username: $username) {
            id
            bio
            username
            following {
                id
                username
            }
            followers {
                id
                username
            }
            messages {
                id
                message
                time
                user {
                    username
                    id
                }
            }
        }
    }
    `, `getUser`, obj)
}

export const follow: Follow = async(obj) => {
    return await gql(`
    mutation($token: String!, $to: ID!) {
        follow(token: $token, to: $to)
    }
    `, `follow`, obj)
}

export const unfollow: Follow = async(obj) => {
    return await gql(`
    mutation($token: String!, $to: ID!) {
        unfollow(token: $token, to: $to)
    }
    `, `unfollow`, obj)
}