var last_status = "";
var last_local_snap = "";
var last_manu_back = "";
var last_auto_back = "";

const default_toast_timeout = 10000;
let loadingModal;
let nextcloud_setting_modal;
let backup_setting_modal;
document.addEventListener('DOMContentLoaded', function () {
    $.ajaxSetup({ traditional: true });
    updateLocalSnaps();
    update_status();
    loadingModal = new bootstrap.Modal(document.getElementById('loading-modal'), {
        keyboard: false,
        backdrop: 'static'
    });
    nextcloud_setting_modal = new bootstrap.Modal(document.getElementById('modal-settings-nextcloud'));
    backup_setting_modal = new bootstrap.Modal(document.getElementById('modal-settings-backup'));

    setInterval(update_status, 500);
    setInterval(updateLocalSnaps, 5000);
    listeners();

});

function updateDynamicListeners() {
    $('.local-snap-listener').click(function () {
        let id = this.getAttribute('data-id');
        console.log(id);
    });
    let manual_back_list = $('.manual-back-list');
    manual_back_list.unbind();
    manual_back_list.click(function () {
        let id = this.getAttribute('data-id');
        let name = this.getAttribute('data-name');
        manualBackup(id, name);
    })
    $('.restore').click(function () {
        let to_restore = this.getAttribute('data-id');
        console.log(to_restore)
        restore(to_restore)

    })
}

function updateLocalSnaps() {
    let needUpdate = false;
    $.get('./api/formated-local-snap', (data) => {
        if (JSON.stringify(data) === last_local_snap)
            return;
        last_local_snap = JSON.stringify(data);
        needUpdate = true;
        let local_snaps = $('#local_snaps');
        local_snaps.empty();
        local_snaps.html(data);
    }).always(() => {
        updateManuBackup(needUpdate);
    });
}

function updateManuBackup(prevUpdate) {
    let needUpdate = false;
    $.get('./api/formated-backup-manual', (data) => {
        if (JSON.stringify(data) === last_manu_back)
            return;
        last_manu_back = JSON.stringify(data);
        needUpdate = true;
        let manual_backups = $('#manual_backups')
        manual_backups.empty();
        manual_backups.html(data);

    }).always(() => {
        updateAutoBackup(prevUpdate || needUpdate);
    });
}

function updateAutoBackup(prevUpdate) {
    let needUpdate = false;
    $.get('./api/formated-backup-auto', (data) => {
        if (JSON.stringify(data) === last_auto_back)
            return;
        needUpdate = true;
        last_auto_back = JSON.stringify(data);
        let auto_backups = $('#auto_backups')
        auto_backups.empty();
        auto_backups.html(data);

    }).always(() => {
        if (prevUpdate || needUpdate)
            updateDynamicListeners();
    });
}

function update_status() {
    $.get('./api/status', (data) => {
        if (JSON.stringify(data) !== last_status) {
            last_status = JSON.stringify(data);
            let buttons = $('#btn-backup-now, #btn-clean-now');
            switch (data.status) {
                case "error":
                    printStatus('Error', data.message);
                    buttons.removeClass("disabled");
                    break;
                case "idle":
                    printStatus('Idle', "Waiting for next backup.");
                    buttons.removeClass("disabled");
                    break;
                case "download":
                    printStatusWithBar('Downloading Snapshot', data.progress);
                    buttons.addClass("disabled");
                    break;
                case "download-b":
                    printStatusWithBar('Downloading Backup', data.progress);
                    buttons.addClass("disabled");
                    break;
                case "upload":
                    printStatusWithBar('Uploading Snapshot', data.progress);
                    buttons.addClass("disabled");
                    break;
                case "upload-b":
                    printStatusWithBar('Uploading Snapshot', data.progress);
                    buttons.addClass("disabled");
                    break;
                case "creating":
                    printStatusWithBar('Creating Snapshot', data.progress);
                    buttons.addClass("disabled");
                    break;
            }
            if (data.last_backup != null) {
                let last_back_status = $('#last_back_status');
                if (last_back_status.html() !== data.last_backup)
                    last_back_status.html(data.last_backup);
            }
            if (data.next_backup != null) {
                let next_back_status = $('#next_back_status');
                if (next_back_status.html() !== data.next_backup)
                    next_back_status.html(data.next_backup);
            }
        }


    });
}


function printStatus(status, secondLine) {
    let status_jq = $('#status');
    status_jq.empty();
    status_jq.html(status);
    let status_s_l_jq = $('#status-second-line');
    status_s_l_jq.empty();
    status_s_l_jq.removeClass('text-center');
    status_s_l_jq.html(secondLine);
    $('#progress').addClass("invisible");
}

function printStatusWithBar(status, progress) {
    let status_jq = $('#status')
    status_jq.empty();
    status_jq.html(status);
    let secondLine = $('#status-second-line')
    secondLine.empty();
    secondLine.html(progress === -1 ? "Waiting..." : (Math.round(progress * 100) + "%"));
    secondLine.addClass("text-center");

    let progressDiv = $('#progress');
    progressDiv.removeClass("invisible");
    if (progress === -1) {
        progressDiv.children().css('width', "100%");
        progressDiv.children().addClass('progress-bar-striped progress-bar-animated');
    } else {
        progressDiv.children().removeClass('progress-bar-striped progress-bar-animated');
        progressDiv.children().css('width', (progress * 100) + "%");
    }

}

function listeners() {
    $('#btn-backup-now').click(backupNow);
    $('#btn-clean-now').click(cleanNow);

    $('#trigger-backup-settings').click(getBackupSettings);
    $('#cron-drop-settings').change(updateDropVisibility);
    $('#save-backup-settings').click(sendBackupSettings);

    $('#trigger-nextcloud-settings').click(getNextcloudSettings);
    $('#save-nextcloud-settings').click(sendNextcloudSettings);
    $('#ssl').change(function () {
        let div = $('#self_signed').parent().parent();
        if ($('#ssl').is(':checked'))
            div.removeClass("invisible")
        else
            div.addClass("invisible");
    });
}

function restore(id) {
    loadingModal.show();
    $.post('./api/restore', { path: id })
        .done(() => {
            console.log("Restore cmd send !");
            create_toast("success", "Command send !", default_toast_timeout);
        })
        .fail((error) => {
            console.log(error);
            create_toast("error", "Can't send command !", default_toast_timeout);
        })
        .always(() => loadingModal.hide())
}

function sendNextcloudSettings() {
    loadingModal.show();
    nextcloud_setting_modal.hide();
    let ssl = $('#ssl').is(':checked')
    let self_signed = $('#self_signed').is(':checked')
    let hostname = $('#hostname').val();
    let username = $('#username').val();
    let password = $('#password').val();
    let back_dir = $('#back-dir').val();
    $.post('./api/nextcloud-settings', {
        ssl: ssl,
        host: hostname,
        username: username,
        password: password,
        back_dir: back_dir,
        self_signed: self_signed
    })
        .done(() => {
            console.log('Saved');
            $('#nextcloud_settings_message').parent().addClass("d-none");
            create_toast("success", "Nextcloud settings saved !", default_toast_timeout);
            0
        })
        .fail((data) => {
            let nextcloud_settings_message = $('#nextcloud_settings_message')
            if (data.status === 406) {
                console.log(data.responseJSON.message);
                nextcloud_settings_message.html(data.responseJSON.message);

            } else {
                nextcloud_settings_message.html("Invalid Settings.");

            }
            nextcloud_settings_message.parent().removeClass("d-none");
            nextcloud_setting_modal.show();
            create_toast("error", "Invalid Nextcloud settings !", default_toast_timeout);
            console.log('Fail');
        }).always(() => {
        loadingModal.hide();
    })
}

function manualBackup(id, name) {
    $.post(`./api/manual-backup?id=${id}&name=${name}`)
        .done(() => {
            console.log("manual bk cmd send !");
            create_toast("success", "Command send !", default_toast_timeout);
        })
        .fail((error) => {
            console.log(error);
            create_toast("error", "Can't send command !", default_toast_timeout);
        })
}


function getNextcloudSettings() {
    loadingModal.show();
    $.get('./api/nextcloud-settings', (data) => {
        $('#ssl').prop("checked", data.ssl === "true");
        let sef_signed_jq = $('#self_signed')
        if (data.ssl === "true") {
            let div = sef_signed_jq.parent().parent();
            div.removeClass("invisible");
        }
        sef_signed_jq.prop('checked', data.self_signed === "true")
        $('#hostname').val(data.host);
        $('#username').val(data.username);
        $('#password').val(data.password);
        $('#back-dir').val(data.back_dir);
        loadingModal.hide();
        nextcloud_setting_modal.show();
    });
}

function backupNow() {
    loadingModal.show();
    $.post('./api/new-backup')
        .done(() => {
            create_toast("success", "Command send !", default_toast_timeout);
        })
        .fail((error) => {
            console.log(error);
            create_toast("error", "Can't send command !", default_toast_timeout);
        })
        .always(() => {
            loadingModal.hide();
        })
}

function cleanNow() {
    loadingModal.show();
    $.post('./api/clean-now')
        .done(() => {
            create_toast("success", "Command send !", default_toast_timeout);
        })
        .fail((error) => {
            console.log(error);
            create_toast("error", "Can't send command !", default_toast_timeout);
        })
        .always(() => {
            loadingModal.hide();
        })
}

function getBackupSettings() {
    loadingModal.show();
    $.get('./api/backup-settings', (data) => {
        if (JSON.stringify(data) === "{}") {
            data = {
                cron_base: "0",
                cron_hour: "00:00",
                cron_weekday: "0",
                cron_month_day: "1",
                auto_clean_local: false,
                auto_clean_local_keep: 5,
                auto_clean_backup: false,
                auto_clean_backup_keep: 5,
            }
        }

        $('#cron-drop-settings').val(data.settings.cron_base);
        $('#name-template').val(data.settings.name_template);


        $('#timepicker').val(data.settings.cron_hour);
        $('#cron-drop-day-month-read').val(data.settings.cron_month_day);
        $('#cron-drop-day-month').val(data.settings.cron_month_day);


        $('#auto_clean_local').prop('checked', data.settings.auto_clean_local === "true");
        $('#local-snap-keep').val(data.settings.auto_clean_local_keep);
        $('#auto_clean_backup').prop('checked', data.settings.auto_clean_backup === "true");
        $('#backup-snap-keep').val(data.settings.auto_clean_backup_keep);

        $('#cron-drop-day').val(data.settings.cron_weekday);
        let folder_html = ""
        for (let thisFolder of data.folders) {
            //TODO Bug ici ?
            let exclude = data.settings.exclude_folder.includes(thisFolder.slug);
            folder_html += `<li class="list-group-item"><div class="form-check"><input class="form-check-input addons-box" type="checkbox" id="${thisFolder.slug}" ${exclude ? "" : "checked"}><label class="form-label mb-0" for="${thisFolder.slug}">${thisFolder.name}</label></div></li>`
        }
        $("#folders-div").html(folder_html);

        let addons_html = ""
        for (let thisAddon of data.addonList) {
            let exclude = data.settings.exclude_addon.includes(thisAddon.slug);
            addons_html += `<li class="list-group-item"><div class="form-check"><input class="form-check-input addons-box" type="checkbox" id="${thisAddon.slug}" ${exclude ? "" : "checked"}><label class="form-label mb-0" for="${thisAddon.slug}">${thisAddon.name}</label></div></li>`
        }
        $("#addons-div").html(addons_html);
        updateDropVisibility();
        loadingModal.hide();
        backup_setting_modal.show();


    });

}

function updateDropVisibility() {
    let cronBase = $("#cron-drop-settings").val();
    let timepicker = $('#timepicker');
    let cron_drop_day = $('#cron-drop-day');
    let cron_drop_day_mount = $('#cron-drop-day-month');
    switch (cronBase) {
        case "3":
            timepicker.parent().parent().removeClass("d-none");
            cron_drop_day.parent().parent().addClass("d-none");
            cron_drop_day_mount.parent().parent().removeClass("d-none");

            break;
        case "2":
            timepicker.parent().parent().removeClass("d-none");
            cron_drop_day.parent().parent().removeClass("d-none");
            cron_drop_day_mount.parent().parent().addClass("d-none");
            break;
        case "1":
            timepicker.parent().parent().removeClass("d-none");
            cron_drop_day.parent().parent().addClass("d-none");
            cron_drop_day_mount.parent().parent().addClass("d-none");
            break;
        case "0":
            timepicker.parent().parent().addClass("d-none");
            cron_drop_day.parent().parent().addClass("d-none");
            cron_drop_day_mount.parent().parent().addClass("d-none");
            break;
    }
}

function sendBackupSettings() {
    let cron_month_day = $('#cron-drop-day-month').val();
    let cron_weekday = $('#cron-drop-day').val();
    let cron_hour = $('#timepicker').val();
    let cron_base = $('#cron-drop-settings').val();
    let auto_clean_local = $("#auto_clean_local").is(':checked');
    let auto_clean_backup = $("#auto_clean_backup").is(':checked');
    let auto_clean_local_keep = $("#local-snap-keep").val();
    let auto_clean_backup_keep = $("#backup-snap-keep").val();
    let name_template = $('#name-template').val();
    //TODO Bug ici ?
    let excluded_folders_nodes = document.querySelectorAll('.folders-box:not(:checked)');
    let exclude_folder = [""];
    for (let i of excluded_folders_nodes) {
        exclude_folder.push(i.id);
    }

    let excluded_addons_nodes = document.querySelectorAll('.addons-box:not(:checked)');
    let exclude_addon = [""];
    for (let i of excluded_addons_nodes) {
        exclude_addon.push(i.id);
    }

    loadingModal.show();
    backup_setting_modal.hide();
    $.post('./api/backup-settings',
        {
            name_template: name_template,
            cron_base: cron_base,
            cron_hour: cron_hour,
            cron_weekday: cron_weekday,
            cron_month_day: cron_month_day,
            auto_clean_local: auto_clean_local,
            auto_clean_local_keep: auto_clean_local_keep,
            auto_clean_backup: auto_clean_backup,
            auto_clean_backup_keep: auto_clean_backup_keep,
            exclude_addon: exclude_addon,
            exclude_folder: exclude_folder
        })
        .done(() => {
            create_toast("success", "Backup settings saved !", default_toast_timeout);

        })
        .fail(() => {
            create_toast("error", "Can't save backup settings !", default_toast_timeout);
            backup_setting_modal.show();
        })
        .always(() => {
            loadingModal.hide();
        });
}