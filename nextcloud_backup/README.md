# Home Assistant Add-ons: Nextcloud Backup
![Nextcloud Backup Logo][logo]

[![Release][release-shield]][release] ![Project Stage][project-stage-shield] ![Project Maintenance][maintenance-shield]

<a href="https://www.buymeacoffee.com/seb6596"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=seb6596&button_colour=FFDD00&font_colour=000000&font_family=Lato&outline_colour=000000&coffee_colour=ffffff" width='20%'></a>


## About

Easily backup your Home Assistant snapshots to Nextcloud.
### Features

- __Auto Backup__ : Configure this add-on to automatically backup your HassIO instance
- __Selective Backup__ : You can specify witch folder and add-on you want to backup.
- __Password protected Backup__ : this add-on can use the Home Assistant snapshot encryption.  
- __Auto Clean__ : You can specify the maximum number of local snapshots and (__ONLY__) auto backed-up snapshots.
- __Auto Stop__ : This addon can stop addons before backup and restart them after backup
- __Restore__ : Upload backed-up snapshot to Home assistant.
- __Web UI__ : All the configuration is based on an easy-to-use web interface, no yaml needed.
- __Home Assistant State Entities__ : This addon create 2 entite in HA : `binary_sensor.nextcloud_backup_error` and `sensor.nextcloud_backup_status`



[Click here for the full documentation][docs]

![Nextcloud Backup Screenshot](../images/screenshot.png)



[docs]: https://github.com/Sebclem/hassio-nextcloud-backup/blob/master/README.md
[forum-shield]: https://img.shields.io/badge/community-forum-brightgreen.svg
[forum]: https://community.home-assistant.io/
[maintenance-shield]: https://img.shields.io/maintenance/yes/2022.svg
[project-stage-shield]: https://img.shields.io/badge/project%20stage-Beta-red.svg
[release-shield]: https://img.shields.io/github/release/Sebclem/hassio-nextcloud-backup.svg
[release]:  https://github.com/Sebclem/hassio-nextcloud-backup/releases
[logo]: https://github.com/Sebclem/hassio-nextcloud-backup/raw/master/nextcloud_backup/logo.png
