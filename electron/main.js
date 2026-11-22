const { app, BrowserWindow, Menu, shell } = require("electron");

const isMac = process.platform === "darwin";

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 760,
        minWidth: 480,
        minHeight: 320,
        backgroundColor: "#101418",
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    Menu.setApplicationMenu(null);

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    win.loadFile("web/index.html");
}

app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (!isMac) app.quit();
});
