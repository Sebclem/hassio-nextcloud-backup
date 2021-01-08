function create_toast(type, message, delay) {
    let toast_class;
    let icon_class;
    switch (type) {
        case 'error':
            toast_class = 'bg-danger';
            icon_class = 'fa-exclamation-triangle'
            break;

        default:
            toast_class = `bg-${type}`
            icon_class = 'fa-check'
    }
    let toast_id = Date.now().toString();
    let toast_html = `<div id="${toast_id}" class="toast d-flex align-items-center text-white ${toast_class}" role="alert" aria-live="assertive" aria-atomic="true">`
    toast_html += `<div class="toast-body h5 mb-0"><i class="fas ${icon_class} me-2"></i> ${message}</div>`
    toast_html += `<button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button></div>`
    $('#toast-container').prepend(toast_html);
    let toast_dom = document.getElementById(toast_id)
    let toast = new bootstrap.Toast(toast_dom, {
        animation: true,
        autohide: delay !== -1,
        delay: delay
    });
    toast_dom.addEventListener('hidden.bs.toast', function () {
        this.remove();
    });
    toast.show();
    return toast;
}