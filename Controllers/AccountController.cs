using Microsoft.AspNetCore.Mvc;
using TaskTracker.Data;
using TaskTracker.Models;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using BCrypt.Net;

namespace TaskTracker.Controllers
{
    public class AccountController : Controller
    {
        private readonly AppDbContext _context;

        public AccountController(AppDbContext context)
        {
            _context = context;
        }

        // ============================
        // LOGIN (GET)
        // ============================
        public IActionResult Login()
        {
            // Redirect authenticated users to Home
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }

            return View();
        }

        // ============================
        // LOGIN (POST)
        // ============================
        [HttpPost]
        public async Task<IActionResult> Login(string usernameOrEmail, string password)
        {
            if (string.IsNullOrWhiteSpace(usernameOrEmail) || string.IsNullOrWhiteSpace(password))
            {
                ViewBag.Error = "Please enter your credentials.";
                return View();
            }

            var normalizedInput = usernameOrEmail.Trim().ToLower();

            var user = _context.Users.FirstOrDefault(u =>
                (u.Username.ToLower() == normalizedInput ||
                 u.Email.ToLower() == normalizedInput));

            // Verify hashed password
            if (user != null && BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email)
                };

                var identity = new ClaimsIdentity(
                    claims,
                    CookieAuthenticationDefaults.AuthenticationScheme);

                var principal = new ClaimsPrincipal(identity);

                var authProperties = new AuthenticationProperties
                {
                    IsPersistent = true, 
                    ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
                    AllowRefresh = true
                };

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    principal,
                    authProperties);

                return RedirectToAction("Index", "Home");
            }

            ViewBag.Error = "Invalid username/email or password.";
            return View();
        }

        // ============================
        // LOGOUT
        // ============================
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            HttpContext.Session.Clear();
            return RedirectToAction("Login", "Account");
        }

        // ============================
        // REGISTER (GET)
        // ============================
        public IActionResult Register()
        {
            if (User.Identity != null && User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Index", "Home");
            }

            return View();
        }

        // ============================
        // REGISTER (POST)
        // ============================
        [HttpPost]
        public async Task<IActionResult> Register(
            string username,
            string email,
            string password,
            string confirmPassword)
        {
            // Password confirmation check
            if (password != confirmPassword)
            {
                ViewBag.Error = "Passwords do not match.";
                return View();
            }

            // Normalize input
            var normalizedUsername = username.Trim().ToLower();
            var normalizedEmail = email.Trim().ToLower();

            // Check if username exists
            if (_context.Users.Any(u =>
                u.Username != null &&
                u.Username.Trim().ToLower() == normalizedUsername))
            {
                ViewBag.Error = "Username already exists.";
                return View();
            }

            // Validate email format
            var emailRegex = new Regex(
                @"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");

            if (!emailRegex.IsMatch(email))
            {
                ViewBag.Error = "Invalid email format.";
                return View();
            }

            // Check if email exists
            if (_context.Users.Any(u =>
                u.Email != null &&
                u.Email.Trim().ToLower() == normalizedEmail))
            {
                ViewBag.Error = "Email already exists.";
                return View();
            }

            // Validate password strength
            var passwordRegex = new Regex(
                @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$");

            if (!passwordRegex.IsMatch(password))
            {
                ViewBag.Error = "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.";
                return View();
            }

            // Create user with hashed password
            var user = new User
            {
                Username = username.Trim(),
                Email = email.Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(password)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Create claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var identity = new ClaimsIdentity(
                claims,
                CookieAuthenticationDefaults.AuthenticationScheme);

            var principal = new ClaimsPrincipal(identity);

            var authProperties = new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(7),
                AllowRefresh = true
            };

            // Automatically log in the user after registration
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                principal,
                authProperties);

            return RedirectToAction("Index", "Home");
        }
    }
}