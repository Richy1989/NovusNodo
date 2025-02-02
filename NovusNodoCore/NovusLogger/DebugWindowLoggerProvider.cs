﻿using System.Collections.Concurrent;
using System.Runtime.Versioning;
using Microsoft.Extensions.Logging;
using NovusNodoCore.Managers;


namespace NovusNodoCore.NovusLogger
{
    [UnsupportedOSPlatform("browser")]
    [ProviderAlias("DebugWindowLogger")]
    public sealed class DebugWindowLoggerProvider : ILoggerProvider
    {
        private readonly ConcurrentDictionary<string, DebugWindowLogger> _loggers = new(StringComparer.OrdinalIgnoreCase);
        private ExecutionManager executionManager = null;
        public DebugWindowLoggerProvider(IServiceProvider serviceProvider)
        {
            //executionManager= (ExecutionManager)serviceProvider.GetService(typeof(ExecutionManager));

            //_currentConfig = config.CurrentValue;
        }

        public ILogger CreateLogger(string categoryName)
        {
            var log = _loggers.GetOrAdd(categoryName, name => new DebugWindowLogger(name));
            return log;
        }

        private ExecutionManager GetCurrentConfig()
        {
            return executionManager;
        }

        public void Dispose()
        {
            _loggers.Clear();
        }
    }
}