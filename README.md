# Home Assistant Add-ons: Nextcloud Backup

[![GitHub Release][releases-shield]][releases]
![Project Stage][project-stage-shield]
[![License][license-shield]](LICENSE)

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

![Project Maintenance][maintenance-shield]

[![Community Forum][forum-shield]][forum]

<a href="https://www.buymeacoffee.com/seb6596"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=seb6596&button_colour=FFDD00&font_colour=000000&font_family=Lato&outline_colour=000000&coffee_colour=ffffff" width='20%'></a>



Easily backup your Home Assistant snapshots to Nextcloud

![Nextcloud Backup Screenshot](images/screenshot.png)

## About

Easily backup your Home Assistant snapshots to Nextcloud.
Auto backup can be configured via the web interface.
### Features

- __Auto Backup__ : Configure this add-on to automatically backup your HassIO instance
- __Selective Backup__ : You can specify witch folder and add-on you want to backup.
- __Password protected Backup__ : this add-on can use the Home Assistant snapshot encryption.
- __Auto Clean__ : You can specify the maximum number of local snapshots and (__ONLY__) auto backed-up snapshots.
- __Restore__ : Upload backed-up snapshot to Home assistant.
- __Auto Stop__ : This addon can stop addons before backup and restart them after backup 
- __Web UI__ : All the configuration is based on an easy-to-use web interface, no yaml needed.
- ~~__Home Assistant State Entities__ : This addon create 2 entite in HA : `binary_sensor.nextcloud_backup_error` and `sensor.nextcloud_backup_status`~~
> __Info:__
> Auto Clean is executed after every upload and every day at 00h30

## Installation

The installation of this add-on is pretty straightforward and not different in
comparison to installing any other Hass.io add-on.

1. [Add our Home Assisant add-ons repository][repository] to your HassOS instance.
1. Install the "Nextcloud Backup" add-on.
1. Start the "Nextcloud Backup" add-on
1. Check the logs of the "Nextcloud Backup" add-on to see if everything went well.
1. Open the web UI for the "Nextcloud Backup" to configure the add-on.

> **NOTE**: Do not add this repository to HassOS, please use: `https://github.com/Sebclem/sebclem-hassio-addon-repository`.

## Configuration
The configuration documention can be found [here][config_doc]

## Support

Got questions?

You have several options to get them answered:

- The [Home Assistant Discord chat server][discord-ha] for general Home
  Assistant discussions and questions.
- The Home Assistant [Community Forum][forum].
- Join the [Reddit subreddit][reddit] in [/r/homeassistant][reddit]

You could also [open an issue here][issue] GitHub.

<!-- ## Contributing

This is an active open-source project. We are always open to people who want to
use the code or contribute to it.

We have set up a separate document containing our
[contribution guidelines](CONTRIBUTING.md).

Thank you for being involved! :heart_eyes: -->

## Authors & contributors

The original setup of this repository is by [Sebastien Clement][Sebclem].

For a full list of all authors and contributors,
check [the contributor's page][contributors].


[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-no-red.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[buymeacoffee-shield]: https://www.buymeacoffee.com/assets/img/guidelines/download-assets-sm-2.svg
[buymeacoffee]: https://www.buymeacoffee.com/seb6596
[Sebclem]: https://github.com/Sebclem
[discord-ha]: https://discord.gg/c5DvZ4e
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg
[forum]: https://community.home-assistant.io/
[i386-shield]: https://img.shields.io/badge/i386-no-red.svg
[issue]: https://github.com/Sebclem/hassio-nextcloud-backup/issues
[license-shield]: https://img.shields.io/github/license/Sebclem/hassio-nextcloud-backup.svg
[maintenance-shield]: https://img.shields.io/maintenance/yes/2024.svg
[project-stage-shield]: https://img.shields.io/badge/project%20stage-Beta-red.svg
[reddit]: https://reddit.com/r/homeassistant
[releases-shield]: https://img.shields.io/github/release/Sebclem/hassio-nextcloud-backup.svg?include_prereleases
[releases]: https://github.com/Sebclem/hassio-nextcloud-backup/releases
[repository]: https://github.com/Sebclem/sebclem-hassio-addon-repository
[contributors]: https://github.com/Sebclem/hassio-nextcloud-backup/graphs/contributors
[semver]: https://semver.org/spec/v2.0.0.htm
[config_doc]: https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/nextcloud_backup/DOCS.md

