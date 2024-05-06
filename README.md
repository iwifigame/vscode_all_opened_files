# 功能概述
本插件旨在提升VSCode用户的工作效率，通过管理打开过的文件、剪贴板历史以及书签，为用户提供更加便捷的文件和剪贴板操作体验。

# 主要功能
* **快速访问打开过的文件**：通过快捷键（alt+shift+o）快速访问之前打开过的所有文件，方便用户在不同文件间切换。
* **书签管理**：支持快速添加书签并访问，用户可以在任意位置添加书签，通过快捷键或书签面板快速跳转到指定的书签位置。书签功能跨文件有效，类似于vim的书签体验。  
    * 快捷书签（类似于vim书签）：  
        * 添加："BookmarkManager.addBookmark", "args": "a"。**注意：需要指定书签参数，可为任意字符**  
        * 跳转： "BookmarkManager.showBookmarkInFile", "args": "a"。**注意：需要指定书签参数，为上面指定的任意字符**  
    建议将以上两个命令添加到快捷键中。
    * 普通书签：
        * 添加："BookmarkManager.addBookmark"。**注意：不需要参数。会自动将当前光标下的内容添加为书签**
        * 显示所有："command": "BookmarkManager.showBookmarks"。弹出所有书签，可查找上面添加过的书签。
* **剪贴板循环粘贴**：用户可多次复制不同的内容，通过快捷键（alt+p）在剪贴板历史中循环切换并粘贴内容，无需重复复制粘贴操作。
* **以指定路径打开文件**：提供命令，允许用户通过指定文件路径快速打开文件，方便在项目中快速定位并打开文件。
* **上一个、下一个函数快速跳转**：支持在函数间快速跳转，通过快捷键快速定位到上一个或下一个函数，提升代码浏览效率。
* **Unity Shader文件格式化**：支持对Unity Shader（*.shader）文件进行格式化，帮助用户规范代码格式，提升代码可读性。


# Features Overview
This plugin aims to enhance the work efficiency of VSCode users by managing opened files, clipboard history, and bookmarks, providing a more convenient file and clipboard operation experience.

# Main Features
* **Quick Access to Opened Files**: Quickly access all previously opened files through the hotkey (alt+shift+o), facilitating easy switching between different files.
* **Bookmark Management**: Supports quick bookmark addition and access. Users can add bookmarks at any location and quickly jump to the designated bookmark position through hotkeys or the bookmark panel. The bookmark feature is cross-file effective, similar to the bookmark experience in vim.
    * Quick Bookmark (Similar to Vim Bookmarks):
        * add: Use the command "BookmarkManager.addBookmark" with the argument "args": "a". **Note: It is necessary to specify a bookmark parameter, which can be any character.**
        * jump: Use the command "BookmarkManager.showBookmarkInFile" with the argument "args": "a". **Note: You need to specify the bookmark parameter, which should be the same arbitrary character specified above.**  
It is recommended to assign shortcut keys to these two commands for faster access.
    * Regular Bookmark:
        * add: Use the command "BookmarkManager.addBookmark". **Note: No parameters are required. The content at the current cursor position will automatically be added as a bookmark.**
        * show all Regular bookmarks: Use the command "BookmarkManager.showBookmarks". This will bring up a list of all bookmarks, allowing you to search for previously added bookmarks.
* **Clipboard Cyclic Paste**: Users can copy different content multiple times and switch and paste content from the clipboard history using the hotkey (alt+p), eliminating the need for repeated copy-paste operations.
* **Open Files with Specified Paths**: Provides a command that allows users to quickly open files by specifying the file path, facilitating rapid navigation and file opening within a project.
* **Quick Navigation between Previous and Next Functions**: Supports rapid jumping between functions using hotkeys, enhancing code browsing efficiency.
* **Unity Shader File Formatting**: Supports formatting of Unity Shader (*.shader) files, assisting users in standardizing code formatting and improving code readability.