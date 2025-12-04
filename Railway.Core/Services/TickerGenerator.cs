using QRCoder;
using System;
using System.IO;

namespace Railway.Core.Services
{
    public static class TicketGenerator
    {
        public static (string base64, byte[] bytes) GenerateQr(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return (null, null);

            using var qrGenerator = new QRCodeGenerator();
            using var qrData = qrGenerator.CreateQrCode(text, QRCodeGenerator.ECCLevel.Q);
            using var qrCode = new PngByteQRCode(qrData);

            byte[] qrBytes = qrCode.GetGraphic(15);
            string base64 = Convert.ToBase64String(qrBytes);

            return (base64, qrBytes);
        }
    }
}
