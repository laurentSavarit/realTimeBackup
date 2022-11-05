# Real Time Backup

Node.js module for real time backup of files and directories.  
This is a simple script to backup a directory to a sd card. Only works on Linux.

Version of node.js required: 10.0.0

## Example

```javascript
    const RealTimeBackup = require('real-time-backup');

    // Create a new instance of RealTimeBackup
    const backup = RealTimeBackup().create(
        {
            dirMount: "/media/dir",
            partitionName: "/dev/dir",
            projectDir: "/home/user/project",
            sdCardName: "sdName",
            activeLog: true
        }
    );

    // Start backup
    backup.start();
```  

## Methods available

### start

- Start backup
- return: void
  
  ```javascript
    backup.start();
  ```

### setCopyToBackup

- Set the copy to backup => arg: true or false
- return: void
  
  ```javascript
    backup.setCopyToBackup(true);
  ```

### isMounted

- Check if the partition is mounted
- return: boolean (true or false)
  
  ```javascript
    backup.isMounted();
  ```
