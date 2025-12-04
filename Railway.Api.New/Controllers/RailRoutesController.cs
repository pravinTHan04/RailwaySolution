//using Microsoft.AspNetCore.Mvc;
//using Microsoft.EntityFrameworkCore;
//using Railway.Core.Data;

//[Route("api/[controller]")]
//[ApiController]
//public class RailRoutesController : ControllerBase
//{
//    private readonly RailwayDbContext _db;

//    public RailRoutesController(RailwayDbContext db)
//    {
//        _db = db;
//    }

//    [HttpGet]
//    public async Task<IActionResult> Get()
//    {
//        var routes = await _db.Routes
//            .Include(r => r.Stops)
//            .ThenInclude(s => s.Station)
//            .ToListAsync();

//        return Ok(routes);
//    }
//}
