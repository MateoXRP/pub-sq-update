# pub-sq-update

## Server operations

- The server runs a cron job that runs the database update task according to the schedule set in `servers/update-db.js`
- The cron schedule runs the update task every hour at 1 minute past the hour.
- Whenever the server restarts, the process checks if the config var `UPDATING_DISABLED` is defined, if so it does nothing, the cron task is not started and the update task is not performed. Any value set on `UPDATING_DISABLED`, even `false` or `null`, will disable the cron task and prevent database updates. The server will log out "Update disabled" one time and the compute process continues running but no other functions will be run.
- When the cron task is running, it will run the update controller according to the cron schedule, currently set to once per hour.
- The update controller checks the config var `USE_DEFAULT_END_DATE`, and if it is defined to any value, the update function will use the date set in the config var `DEFAULT_END_DATE`. In this case, the update function will look for unsaved transactions back to the default end date.
- If the config var `USE_DEFAULT_END_DATE` is not defined, the update controller gets the last update record saved in the database and uses the date saved as `nextEndDate`. This date is the date of the last update.
- The update controller will log out the following every time the update function is run:
  - Current timestamp;
  - Whether the update controller is using the default end date or the date saved as `nextEndDate` in the most recent database update record;
  - Totals for new posts, comments and likes saved to the database during the update; and,
  - 'Last updated at' timestamp, which is saved as the `nextEndDate` in the update record saved to the database.

---

## Server controls

TO TURN OFF UPDATES:

- Set the config var `UPDATING_DISABLED` to any value. The server will automatically restart the compute process and turn off the cron task and no updates will be performed.

TO TURN ON UPDATES:

- Remove the value set for `UPDATING_DISABLED` and the cron task will resume updates according to the cron schedule.

TO FORCE AN UPDATE back to a date prior to that of the last update:

- Set the config var `DEFAULT_END_DATE` to the desired date as a string in the following format: '[month]-[day]-[year]', for example '01-01-2022'.
- Then set the config var `USE_DEFAULT_END_DATE` to any value and after the server and cron task restart, the update controller will use the date set in config var `DEFAULT_END_DATE` when updating the database.
- After the update controller has run at least once and updated the database back through the default end date, remove the value set for config var `USE_DEFAULT_END_DATE`. Otherwise, the update controller will needlessly re-check all transaction since the default update date every time the update controller runs.
