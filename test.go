package main

import (
	"bytes"
	"fmt"
	"net/http"
)

func main() {
	res, err := http.Post("http://localhost:8080/api/v1/users/guest", "application/json", nil)
	if err != nil {
		fmt.Println("Err:", err)
		return
	}
	cookie := res.Cookies()[0]
	fmt.Println("Cookie:", cookie.Name, cookie.Value)
	
	body := []byte(`{"username": "UniqueTestName123"}`)
	req, _ := http.NewRequest("PATCH", "http://localhost:8080/api/v1/users/me", bytes.NewBuffer(body))
	req.AddCookie(cookie)
	req.Header.Add("Content-Type", "application/json")
	
	client := &http.Client{}
	res2, err := client.Do(req)
	if err != nil {
		fmt.Println("Err2:", err)
		return
	}
	
	var buf bytes.Buffer
	buf.ReadFrom(res2.Body)
	fmt.Println("Status:", res2.StatusCode)
	fmt.Println("Body:", buf.String())
}
