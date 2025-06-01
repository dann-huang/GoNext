package main

import "testing"

func TestHello(t *testing.T) {
	resp := "hello"
	if resp != "hello" {
		t.Errorf("expected 'hello', got '%s'", resp)
	}
}
