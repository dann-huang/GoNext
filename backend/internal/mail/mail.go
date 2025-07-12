package mail

import (
	"fmt"

	"gonext/internal/config"

	"github.com/resend/resend-go/v2"
)

type Mailer interface {
	VerificationEmail(email, code string) error
	SendLoginCode(email, username, code string) error
}

type resendMailer struct {
	client *resend.Client
	from   string
}

func NewResendMailer(cfg *config.Mail) Mailer {
	client := resend.NewClient(cfg.MailKey)
	return &resendMailer{
		client: client,
		from:   cfg.MailFrom,
	}
}

func (s *resendMailer) VerificationEmail(email, code string) error {
	emailBody := fmt.Sprintf(`
		<h1>Verify Your Email</h1>
		<p>Your verification code is: <strong>%s</strong></p>
		<p>This code will expire in 10 minutes.</p>
	`, code)

	if _, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.from,
		To:      []string{email},
		Subject: "Verify Your Email",
		Html:    emailBody,
	}); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	return nil
}

func (s *resendMailer) SendLoginCode(email, username, code string) error {
	emailBody := fmt.Sprintf(`
		<h1>Login Code</h1>
		<p>Hello %s,</p>
		<p>Your login code is: <strong>%s</strong></p>
		<p>This code will expire in 10 minutes.</p>
		<p>If you didn't request this code, you can safely ignore this email.</p>
	`, username, code)

	if _, err := s.client.Emails.Send(&resend.SendEmailRequest{
		From:    s.from,
		To:      []string{email},
		Subject: "Your Login Code",
		Html:    emailBody,
	}); err != nil {
		return fmt.Errorf("failed to send login code email: %w", err)
	}

	return nil
}

type mockMailer struct{}

func NewMockMailer() Mailer {
	return &mockMailer{}
}

func (m *mockMailer) VerificationEmail(email, code string) error {
	fmt.Printf("***** Verification Code for %s: %s *****\n", email, code)
	return nil
}

func (m *mockMailer) SendLoginCode(email, username, code string) error {
	fmt.Printf("***** Login Code for %s: %s *****\n", email, code)
	return nil
}
