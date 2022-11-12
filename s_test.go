package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func gql(query string) *http.Request {
	body, _ := json.Marshal(struct {
		Query string `json:"query"`
	}{query})

	r := httptest.NewRequest("POST", "/query", bytes.NewReader(body))
	r.Header.Set("Accept", "application/json")
	return r
}

func runGql(t *testing.T, query string) {
	h := newRelay()
	w := httptest.NewRecorder()
	h.ServeHTTP(w, gql(query))
	t.Log(w.Body.String())
}

func TestA(t *testing.T) {
	runGql(t, `
query {
getTimeline(userId: "6059aa9f-7823-4fc3-8567-70339643203d") {
	message
	time
	user {
		username
	}
}
}
`)
}
