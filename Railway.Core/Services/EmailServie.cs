using MailKit.Net.Smtp;
using MimeKit;
using Railway.Core.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace Railway.Core.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public EmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_settings.From));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;
            email.Body = new TextPart("plain") { Text = body };

            await Send(email);
        }

        public async Task SendEmailWithAttachmentAsync(
            string to,
            string subject,
            string htmlBody,
            byte[] attachment,
            string fileName)
        {
            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_settings.From));
            email.To.Add(MailboxAddress.Parse(to));
            email.Subject = subject;

            var builder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };

            builder.Attachments.Add(fileName, attachment);

            email.Body = builder.ToMessageBody();

            await Send(email);
        }

        private async Task Send(MimeMessage message)
        {
            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(_settings.SmtpServer, _settings.Port, MailKit.Security.SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_settings.Username, _settings.Password);
            await smtp.SendAsync(message);
            await smtp.DisconnectAsync(true);
        }
    }
}
