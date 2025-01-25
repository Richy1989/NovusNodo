using MudBlazor.Services;
using NovusNodo.Components;
using NovusNodo.Management;
using NovusNodo.PluginManagement;
using NovusNodoCore;
using NovusNodoCore.Managers;
using NovusNodoCore.NovusLogger;

namespace NovusNodo
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            builder.Logging.ClearProviders();
            builder.Logging.AddColorConsoleLogger(configuration =>
            {
                // Replace warning value from appsettings.json of "Cyan"
                configuration.LogLevelToColorMap[LogLevel.Warning] = ConsoleColor.DarkCyan;
                // Replace warning value from appsettings.json of "Red"
                configuration.LogLevelToColorMap[LogLevel.Error] = ConsoleColor.DarkRed;
            });

            builder.Logging.AddNovusDebugWindowLogger();

            builder.Services.AddSingleton<NovusUIManagement>();

            builder.Services.AddNovusCoreComponents();

            // Add MudBlazor services
            builder.Services.AddMudServices();

            //Load Novus Plugins
            builder.Services.AddPluginComponents();
            builder.Services.LoadStaticFilesOfPlugins();
            builder.Services.AddSimplePluginComponents();

            // Add services to the container.
            builder.Services.AddRazorComponents()
                .AddInteractiveServerComponents();

            var app = builder.Build();

            //Initialize Novus Core
            ExecutionManager executionManager = app.Services.GetRequiredService<ExecutionManager>();
            executionManager.Initialize();

            //Initialize Novus LoadSaveManager
            LoadSaveManager loadSaveManager = app.Services.GetRequiredService<LoadSaveManager>();
            await loadSaveManager.LoadProject().ConfigureAwait(false);

            // Configure the HTTP request pipeline.
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Error");
                // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                app.UseHsts();
            }

            app.MapStaticAssets();
            app.UseHttpsRedirection();

            app.UseStaticFiles();

            app.UseAntiforgery();

            app.MapRazorComponents<App>()
                .AddInteractiveServerRenderMode();

            app.Run();
        }
    }
}
