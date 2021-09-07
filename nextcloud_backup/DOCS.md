## Installation

The installation of this add-on is pretty straightforward and not different in
comparison to installing any other Hass.io add-on.

1. [Add our Home Assisant add-ons repository][repository] to your HassOS instance.
1. Install the "Nextcloud Backup" add-on.
1. Start the "Nextcloud Backup" add-on
1. Check the logs of the "Nextcloud Backup" add-on to see if everything went well.
1. Open the web UI for the "Nextcloud Backup" to configure the add-on.

> **NOTE**: Do not add this repository to HassOS, please use: `https://github.com/Sebclem/sebclem-hassio-addon-repository`.


## NextCloud config

First, you need to configure all your Nextcloud information.

1. Open the add-on Web UI
1. Open NextCloud config menu (Top right gear, and Nextcloud)
1. If your NextCloud instance uses `HTTPS`, enable the `SSL` lever
1. Enter the `hostname` of the NextCloud instance. You can specify a custom port by adding `:[port]` at the end of the hostname (`exemple.com:8080`)
1. Now enter the Nextcloud username that you would like this add-on to use.
1. For the password, we highly recommend using an `App Password`.

   >To generate a `App Password`, go into your personal setting into Nextcloud, Security page. You can generate one via the `Devices & sessions` section. Simply enter a name and hit `Create new app password`.
1. You can change the backup directory in Nextcloud. Default is `/Hassio Backup/`.

## Backup config
You can now configure the automatic backup.

1. Open the add-on Web UI
1. Open Backup config menu (Top right gear, and Backup)
1. Specify the backup naming template, this will define how your backup will be named. 
   On this field, you can use some variables that are documented [here][variable_doc].
   The default value is `{type}-{ha_version}-{date}_{hour}`.
1. You can now choose witch folder and add-on you want to include in your backup.
1. If you want to protect your backup with a password, enable `Password Protected` and specify the password.
1. Now select the backup frequency.
1. If you want to auto stop addons before backup, select then in `Auto Stop Addons` (*Note: These addons will be re-started after backup*)
1. You can finally enable Auto clean for Local Snapshot (Snapshot in Home Assistant) and Nextcloud Backups.
   If enabled, you can specify how much Local Snapshot and Nextcloud Backup you want to keep before deleting the older one.
> __Info:__
> Auto Clean is executed after every upload and every day at 00h30


## Home Assitant Os Configuration

**Note**: _Remember to restart the add-on when the configuration is changed._

Example add-on configuration:

```json
{
  "log_level": "info"
}
```

### Option: `log_level`

The `log_level` option controls the level of log output by the addon and can
be changed to be more or less verbose, which might be useful when you are
dealing with an unknown issue. Possible values are:

- `trace`: Show every detail, like all called internal functions.
- `debug`: Shows detailed debug information.
- `info`: Normal (usually) interesting events.
- `warning`: Exceptional occurrences that are not errors.
- `error`:  Runtime errors that do not require immediate action.
- `fatal`: Something went terribly wrong. Add-on becomes unusable.

Please note that each level automatically includes log messages from a
more severe level, e.g., `debug` also shows `info` messages. By default,
the `log_level` is set to `info`, which is the recommended setting unless
you are troubleshooting.

[variable_doc]: https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/nextcloud_backup/naming_template.md
[repository]: https://github.com/Sebclem/sebclem-hassio-addon-repository
