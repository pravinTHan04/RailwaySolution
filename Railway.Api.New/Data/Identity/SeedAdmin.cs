using Microsoft.AspNetCore.Identity;
using Railway.Core.Models;

namespace Railway.Api.Identity
{
    public class SeedAdmin
    {
        public static async Task RunAsync(IServiceProvider service)
        {
            var userManager = service.GetRequiredService<UserManager<AppUser>>();
            var roleManager = service.GetRequiredService<RoleManager<IdentityRole>>();

            // Ensure roles exist
            if (!await roleManager.RoleExistsAsync("Admin"))
                await roleManager.CreateAsync(new IdentityRole("Admin"));

            if (!await roleManager.RoleExistsAsync("User"))
                await roleManager.CreateAsync(new IdentityRole("User"));

            // Create default admin account if missing
            var adminEmail = "admin@railway.com";
            var admin = await userManager.FindByEmailAsync(adminEmail);

            if (admin == null)
            {
                admin = new AppUser
                {
                    Email = adminEmail,
                    UserName = adminEmail,
                };

                await userManager.CreateAsync(admin, "Admin@123");
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }
    }
}
