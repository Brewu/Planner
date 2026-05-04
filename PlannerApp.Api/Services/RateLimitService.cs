using System.Collections.Concurrent;

namespace PlannerApp.Api.Services
{
    public class RateLimitService
    {
        private readonly ConcurrentDictionary<string, List<DateTime>> _requests = new();
        private readonly int _maxRequests;
        private readonly TimeSpan _timeWindow;

        public RateLimitService(int maxRequests = 3, int timeWindowMinutes = 15)
        {
            _maxRequests = maxRequests;
            _timeWindow = TimeSpan.FromMinutes(timeWindowMinutes);
        }

        public bool IsAllowed(string key)
        {
            var now = DateTime.UtcNow;

            if (!_requests.ContainsKey(key))
            {
                _requests[key] = new List<DateTime> { now };
                return true;
            }

            // Remove old requests
            _requests[key].RemoveAll(t => t < now - _timeWindow);

            if (_requests[key].Count >= _maxRequests)
            {
                return false;
            }

            _requests[key].Add(now);
            return true;
        }
    }
}
