using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Railway.Api.Data;
using Railway.Core.Data;

[ApiController]
[Route("api/[controller]")]
public class TrainTypesController : ControllerBase
{
    private readonly RailwayDbContext _db;

    public TrainTypesController(RailwayDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var types = await _db.TrainTypes.ToListAsync();
        return Ok(types);
    }
}
