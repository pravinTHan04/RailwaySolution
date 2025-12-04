//using Microsoft.Extensions.Hosting;
//using Railway.Core.Services.Interfaces;

//namespace Railway.Api.Services
//{
//    public class BookingCleanupService : BackgroundService
//    {
//        private readonly ISeatAllocationService _seatService;
//        private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

//        public BookingCleanupService(ISeatAllocationService seatService)
//        {
//            _seatService = seatService;
//        }

//        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
//        {
//            while (!stoppingToken.IsCancellationRequested)
//            {
//                await _seatService.ReleaseExpiredLocksAsync();
//                await Task.Delay(_interval, stoppingToken);
//            }
//        }
//    }
//}
