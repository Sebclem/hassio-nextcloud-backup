var last_status = "";
var last_local_snap = "";
var last_manu_back = "";
var last_auto_back = "";

const default_toast_timeout = 10000;
let loadingModal = null;
let nextcloud_setting_modal;
document.addEventListener('DOMContentLoaded', function () {
    $.ajaxSetup({ traditional: true });
    updateLocalSnaps();
    update_status();
    loadingModal = new bootstrap.Modal(document.getElementById('loading-modal'), {
        keyboard: false,
        backdrop: 'static'
    });
    nextcloud_setting_modal = new bootstrap.Modal(document.getElementById('modal-settings-nextcloud'));

    setInterval(update_status, 500);
    setInterval(updateLocalSnaps, 5000);
    listeners();

});

function updateDynamicListeners() {
    $('.local-snap-listener').click(function () {
        let id = this.getAttribute('data-id');
        console.log(id);
    });
    $('.manual-back-list').unbind();
    $('.manual-back-list').click(function () {
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
        $('#local_snaps').empty();
        $('#local_snaps').html(data);
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
        $('#manual_backups').empty();
        $('#manual_backups').html(data);

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
        $('#auto_backups').empty();
        $('#auto_backups').html(data);

    }).always(() => {
        if (prevUpdate || needUpdate)
            updateDynamicListeners();
    });
}

function update_status() {
    $.get('./api/status', (data) => {
        if (JSON.stringify(data) !== last_status) {
            last_status = JSON.stringify(data);
            switch (data.status) {
                case "error":
                    printStatus('Error', data.message);
                    $('#btn-backup-now, #btn-clean-now').removeClass("disabled");
                    break;
                case "idle":
                    printStatus('Idle', "Waiting for next backup.");
                    $('#btn-backup-now, #btn-clean-now').removeClass("disabled");
                    break;
                case "download":
                    printStatusWithBar('Downloading Snapshot', data.progress);
                    $('#btn-backup-now, #btn-clean-now').addClass("disabled");
                    break;
                case "download-b":
                    printStatusWithBar('Downloading Backup', data.progress);
                    $('#btn-backup-now, #btn-clean-now').addClass("disabled");
                    break;
                case "upload":
                    printStatusWithBar('Uploading Snapshot', data.progress);
                    $('#btn-backup-now, #btn-clean-now').addClass("disabled");
                    break;
                case "upload-b":
                    printStatusWithBar('Uploading Snapshot', data.progress);
                    $('#btn-backup-now, #btn-clean-now').addClass("disabled");
                    break;
                case "creating":
                    printStatusWithBar('Creating Snapshot', data.progress);
                    $('#btn-backup-now, #btn-clean-now').addClass("disabled");
                    break;
            }
            if (data.last_backup != null) {
                if ($('#last_back_status').html() != data.last_backup)
                    $('#last_back_status').html(data.last_backup);
            }
            if (data.next_backup != null) {
                if ($('#next_back_status').html() != data.next_backup)
                    $('#next_back_status').html(data.next_backup);
            }
        }


    });
}


function printStatus(status, secondLine) {
    $('#status').empty();
    $('#status').html(status);
    $('#status-second-line').empty();
    $('#status-second-line').removeClass('text-center');
    $('#status-second-line').html(secondLine);
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
    $('#save-nextcloud-settings').click(sendNextcloudSettings);
    $('#trigger-nextcloud-settings').click(getNextcloudSettings);
    $('#trigger-backup-settings').click(getBackupSettings);
    $('#btn-backup-now').click(backupNow);
    $('#btn-clean-now').click(cleanNow);


    $('#save-backup-settings').click(sendBackupSettings);
    $('#cron-drop-day-month').on('input', function () {
        $('#cron-drop-day-month-read').val($(this).val());
    });

    $('#local-snap-keep').on('input', function () {
        $('#local-snap-keep-read').val($(this).val());
    });

    $('#backup-snap-keep').on('input', function () {
        $('#backup-snap-keep-read').val($(this).val());
    });

    $('#ssl').change(function () {
        let div = $('#self_signed').parent().parent();

        if ($('#ssl').is(':checked'))
            div.removeClass("invisible")
        else
            div.addClass("invisible");
    });

    $('#confirm-restore').click(function () {
        restore(to_restore);
    });


}

function restore(id) {
    loadingModal.show();
    $.post('./api/restore', { path: id })
        .done((data) => {
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
        .done((data) => {
            console.log('Saved');
            $('#nextcloud_settings_message').parent().addClass("d-none");
            create_toast("success", "Nextcloud settings saved !", default_toast_timeout);0
        })
        .fail((data) => {
            if (data.status == 406) {
                console.log(data.responseJSON.message);
                $('#nextcloud_settings_message').html(data.responseJSON.message);

            } else {
                $('#nextcloud_settings_message').html("Invalid Settings.");

            }
            $('#nextcloud_settings_message').parent().removeClass("d-none");
            nextcloud_setting_modal.show();
            create_toast("error", "Invalid Nextcloud settings !", default_toast_timeout);
            console.log('Fail');
        }).always(() => {
        loadingModal.hide();
    })
}

function manualBackup(id, name) {
    $.post('./api/manual-backup?id=' + id + '&name=' + name)
        .done((data) => {
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
        $('#ssl').prop("checked", data.ssl == "true");
        if (data.ssl == "true") {
            let div = $('#self_signed').parent().parent();
            div.removeClass("invisible");
        }
        $('#self_signed').prop('checked', data.self_signed == "true")
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
        if (JSON.stringify(data) == "{}") {
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

        changeSelect('#cron-drop-settings', data.settings.cron_base);
        $('#cron-drop-settings').change(updateDropVisibility);
        $('#name-template').val(data.settings.name_template);
        $('#name-template + label').removeClass("active");
        $('#name-template + label').addClass("active");

        let timepicker = document.querySelector('#timepicker');
        $('#timepicker').val(data.settings.cron_hour);
        $('#timepicker + label').removeClass("active");
        $('#timepicker + label').addClass("active");
        if (M.Timepicker.getInstance(timepicker) != null)
            M.Timepicker.getInstance(timepicker).destroy();
        M.Timepicker.init(timepicker, {
            defaultTime: data.settings.cron_hour,
            twelveHour: false,
            container: 'body'
        });
        $('#cron-drop-day-month-read').val(data.settings.cron_month_day);
        $('#cron-drop-day-month').val(data.settings.cron_month_day);

        $('#cron-drop-day-month-read + label').removeClass("active");
        $('#cron-drop-day-month-read + label').addClass("active");


        $('#auto_clean_local').prop('checked', data.settings.auto_clean_local == "true");
        $('#local-snap-keep').val(data.settings.auto_clean_local_keep);
        $('#auto_clean_backup').prop('checked', data.settings.auto_clean_backup == "true");
        $('#backup-snap-keep').val(data.settings.auto_clean_backup_keep);


        $('#backup-snap-keep + label').removeClass("active");
        $('#backup-snap-keep + label').addClass("active");
        $('#local-snap-keep + label').removeClass("active");
        $('#local-snap-keep + label').addClass("active");

        changeSelect('#cron-drop-day', data.settings.cron_weekday);
        let folder_html = ""
        for (let index in data.folders) {
            let thisFolder = data.folders[index];
            let exclude = data.settings.exclude_folder.includes(thisFolder.slug);
            folder_html += `<li><label><input type="checkbox" class="folders-box" id="${thisFolder.slug}" ${exclude ? "" : "checked=checked"}/><span>${thisFolder.name}</span></label></li>`
        }
        $("#folders-div").html(folder_html);

        let addons_html = ""
        for (let index in data.addonList) {
            let thisAddon = data.addonList[index];
            let exclude = data.settings.exclude_addon.includes(thisAddon.slug);
            addons_html += `<li><label><input type="checkbox" class="addons-box" id="${thisAddon.slug}"  ${exclude ? "" : "checked=checked"}/><span>${thisAddon.name}</span></label></li>`
        }
        $("#addons-div").html(addons_html);
        updateDropVisibility();
        loadingModal.hide();
        M.Modal.getInstance(document.querySelector("#modal-settings-backup")).open()

    });

}

function updateDropVisibility() {
    let cronBase = $("#cron-drop-settings").val();

    switch (cronBase) {
        case "3":
            $('#timepicker').parent().parent().removeClass("hide");
            $('#cron-drop-day').parent().parent().parent().addClass("hide");
            $('#cron-drop-day-month').parent().parent().parent().removeClass("hide");

            break;
        case "2":
            $('#timepicker').parent().parent().removeClass("hide");
            $('#cron-drop-day').parent().parent().parent().removeClass("hide");
            $('#cron-drop-day-month').parent().parent().parent().addClass("hide");
            break;
        case "1":
            $('#timepicker').parent().parent().removeClass("hide");
            $('#cron-drop-day').parent().parent().parent().addClass("hide");
            $('#cron-drop-day-month').parent().parent().parent().addClass("hide");
            break;
        case "0":
            $('#timepicker').parent().parent().addClass("hide");
            $('#cron-drop-day').parent().parent().parent().addClass("hide");
            $('#cron-drop-day-month').parent().parent().parent().addClass("hide");
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
            M.Modal.getInstance(document.querySelector('#modal-settings-backup')).close();
        })
        .fail(() => {
            create_toast("error", "Can't save backup settings !", default_toast_timeout);
            M.toast({
                html: '<i class="material-icons" style="margin-right:10px">warning</i> Can\'t save backup settings !',
                classes: "red"
            });
        }).always(() => {
        loadingModal.hide();
    });
}

function changeSelect(selector, value) {
    let selectBaseRaw = document.querySelector(selector);

    if (M.FormSelect.getInstance(selectBaseRaw) != null)
        M.FormSelect.getInstance(selectBaseRaw).destroy();
    $(selector + ' option[selected]').removeAttr('selected');
    $(selector + ' option[value=' + value + ']').attr('selected', "true");
    M.FormSelect.init(selectBaseRaw, {});
}