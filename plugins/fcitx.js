// @HACK: dactyl.timeout
// :help modes
// rewritten, use ctype
// long time delay

function should() {
    if (!config.OS.isUnix)
        return false;
    let tmpDir = services.directory.get('TmpD', Ci.nsIFile).path;
    let DISPLAY = services.environment.get('DISPLAY');
    let socketfile = tmpDir + '/fcitx-socket-' + DISPLAY;
    let file = io.File(socketfile);
    if (file.exists() && !file.isDirectory())
        return true;
    return false;
}

if (should()) {
    let path = plugins.fcitx.PATH;
    let py_path = path.slice(0, path.length - 2) + 'py';
    let status = 0;
    let post_insert = false;
    let timeout = 10;

    dactyl.registerObserver('enter', function() {
        let query = ['#dactyl-statusline-field-commandline-command',
            '#dactyl-commandline-command'].join(',');
        let inputs = document.querySelectorAll(query);
        Array.slice(inputs).forEach(function(input) {
            input.addEventListener('focus', function(evt) {
                if (post_insert) {
                    io.system(['python', py_path], null, function(result) {
                        status = parseInt(result.output);
                    });
                    post_insert = false;
                }
                io.system(['python', py_path, 'c']);
            });
        });

    });

    dactyl.registerObserver('modes.change', function() {
        let mode_name = modes.mainMode.name;
        switch (mode_name) {
            case 'INSERT' :
            case 'AUTOCOMPLETE' :
            post_insert = true;
            window.setTimeout(function() {
                if (status == 2)
                    io.system(['python', py_path, 'o']);
            }, timeout);
            break;

            default :
            break;
        }
    });
}
