### 1.0.3: 2025-08-31

* Add persistent state storage for known transaction IDs
* Save state only after successful message sending
* Add fallback for category fetching errors
* Send simplified messages when budget details unavailable
* Fix transaction notifications not being sent after restart

### 1.0.2: 2025-08-30

* Only post cleared and reconciled transactions
* Fix "Invalid count value: -1" error from Matrix
* Only send critical error notifications to Matrix
* Remove hardcoded Matrix homeserver
* Require Matrix homeserver in configuration

### 1.0.1: 2025-08-29

* Fix budget getting cached
* Fix budget amount
* Fix rate limiting issue

### 1.0.0: 2025-08-28

* Initial release of YNAB Matrix Bot
* Real-time transaction monitoring
* Budget progress tracking
* Matrix room notifications
* Interactive setup wizard