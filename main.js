const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false, // 準備完了まで非表示
    titleBarStyle: 'default'
  });

  // HTMLファイルを読み込み
  mainWindow.loadFile('index.html');

  // ウィンドウの準備完了時に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 開発時のみデベロッパーツールを開く
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられた時
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // メニューバーを設定
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '新規作成',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'データを開く',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              const filePath = result.filePaths[0];
              try {
                const data = fs.readFileSync(filePath, 'utf8');
                mainWindow.webContents.send('menu-load-file', data);
              } catch (error) {
                dialog.showErrorBox('エラー', 'ファイルの読み込みに失敗しました。');
              }
            }
          }
        },
        {
          label: 'データを保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        {
          label: 'CSVエクスポート',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-csv');
          }
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '編集',
      submenu: [
        {
          label: '行を追加',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.send('menu-add-row');
          }
        },
        {
          label: '全データクリア',
          click: async () => {
            const response = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              buttons: ['キャンセル', '削除'],
              defaultId: 0,
              message: '全てのデータを削除しますか？',
              detail: 'この操作は取り消せません。'
            });
            
            if (response.response === 1) {
              mainWindow.webContents.send('menu-clear-all');
            }
          }
        }
      ]
    },
    {
      label: '表示',
      submenu: [
        {
          label: '再読み込み',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: '全画面表示',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        { type: 'separator' },
        {
          label: '開発者ツール',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'このアプリについて',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'このアプリについて',
              message: '就活企業情報管理アプリ',
              detail: 'バージョン 1.0.0\n\n就職活動における企業情報を効率的に管理するためのアプリケーションです。'
            });
          }
        }
      ]
    }
  ];

  // macOSの場合はメニューを調整
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'このアプリについて',
          role: 'about'
        },
        { type: 'separator' },
        {
          label: 'サービス',
          role: 'services',
          submenu: []
        },
        { type: 'separator' },
        {
          label: app.getName() + 'を隠す',
          accelerator: 'Command+H',
          role: 'hide'
        },
        {
          label: '他を隠す',
          accelerator: 'Command+Shift+H',
          role: 'hideothers'
        },
        {
          label: 'すべて表示',
          role: 'unhide'
        },
        { type: 'separator' },
        {
          label: '終了',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ファイル保存のIPC処理
ipcMain.handle('save-file-dialog', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: `就活データ_${new Date().toISOString().split('T')[0]}.json`
  });
  
  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, data);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, canceled: true };
});

// CSV保存のIPC処理
ipcMain.handle('save-csv-dialog', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'CSV Files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: `就活企業情報_${new Date().toISOString().split('T')[0]}.csv`
  });
  
  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, '\ufeff' + data); // BOM付きで保存
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, canceled: true };
});

// アプリケーションの準備完了時
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全ウィンドウが閉じられた時
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// セキュリティ: 新しいウィンドウの作成を制限
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
  });
});