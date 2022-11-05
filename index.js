const { execSync } = require("child_process");
const { watch } = require("fs");
const chokidar = require("chokidar");


const RealtimeBackup = {

  MEDIA_NAME: "Samsung_T5",
  PARTITION_NAME: "/dev/sdb1",
  DIR_POINT: "/media/laurent",
  ORIGIN_PROJECT_DIR: "/home/laurent/projet-perso",
  APP_DIR: `${this.ORIGIN_PROJECT_DIR}/test-listener-media`,
  MOUNT_POINT: `${this.DIR_POINT}/${this.MEDIA_NAME}`,

  mediaIsMount: false,
  copyToBackup: false,
  firstCopyIsOk: false,
  activeLog: false,

  /**
   * init config for realtime backup
   * @param {{
   *  sdCardName: string;
   *  partitionName:string;
   *  dirMount:string;
   *  projectDir:string;
   *  activeLog?:boolean
   * }} realTimeBackupParams 
   */
  init(realTimeBackupParams) {

    if (!realTimeBackupParams) throw new Error('Expected realTimeBackupParams!');

    if (Object.keys(realTimeBackupParams).length === 0) throw new Error('Expected all keys in realTimeBackupParams!');

    [
      "sdCardName",
      "partitionName",
      "dirMount",
      "projectDir"
    ].forEach((key) => {
      if ([undefined, null].includes(realTimeBackupParams[key])) throw new Error(`Expected ${key} argument!`);
    })

    this.activeLog = realTimeBackupParams.activeLog

    this.MEDIA_NAME = realTimeBackupParams.sdCardName;
    this.PARTITION_NAME = realTimeBackupParams.partitionName;
    this.DIR_POINT = realTimeBackupParams.dirMount;
    this.APP_DIR = realTimeBackupParams.projectDir;
    this.ORIGIN_PROJECT_DIR = this.APP_DIR.split("/").reverse().slice(1).reverse().join("/");
    this.MOUNT_POINT = `${this.DIR_POINT}/${this.MEDIA_NAME}`;
    this.log(this.ORIGIN_PROJECT_DIR);

    return {
      start: this.start.bind(this),
      setCopyToBackup: (arg) => (this.copyToBackup = arg),
      isMounted: this.checkMediaIsMounted.bind(this)
    };

  },

  log(msg) { if (this.activeLog) console.log(msg) },


  checkMediaIsMounted() {
    try {
      execSync(`cat /etc/mtab | grep -c "${this.MOUNT_POINT}"`);
      this.log("MOUNTED");
      this.mediaIsMount = true;
      return true;

    } catch (e) {
      this.log("NOT MOUNTED");
      this.mediaIsMount = false;
      return false;
    }
  },


  appWatcher() {
    chokidar.watch(this.APP_DIR, {
      ignoreInitial: true
    }).on("all", (event, path) => {
      if (this.copyToBackup) {
        this.log("WATCHER APP...");
        this.log(event, path);
        if (!this.firstCopyIsOk) {
          execSync(`cp -R -f ${this.APP_DIR} ${this.MOUNT_POINT}`);
          this.log("FIRST COPY OK");
          this.firstCopyIsOk = true;
        } else {
          switch (event) {
            case "add":
            case "addDir":
            case "change":
              execSync(`cp -R -f ${path} ${path.replace(this.ORIGIN_PROJECT_DIR, this.MOUNT_POINT)}`);
              break;
            case "unlink":
            case "unlinkDir":
              execSync(`rm -R -f ${path.replace(this.ORIGIN_PROJECT_DIR, this.MOUNT_POINT)}`);
              break;
          }
        }
      } else {
        this.firstCopyIsOk = false;
      }
    });

  },


  sdWatcher() {
    this.checkMediaIsMounted();
    watch(this.DIR_POINT, { encoding: "utf-8", recursive: true }, (event, filename) => {
      this.log("WATCHER SD");
      if (filename === this.MEDIA_NAME)
        setTimeout(() => this.checkMediaIsMounted(), 2000);
    });
  },

  start() {
    this.appWatcher();
    this.sdWatcher();
  }
}

/**
 * 
 * @returns {{create: (realTimeBackupParams:
 * {
   *  sdCardName: string;
   *  partitionName:string;
   *  dirMount:string;
   *  projectDir:string;
   * activeLog?:boolean
 *  }
 * )=>({
 *  start:()=>void,
 *  setCopyToBackup:(arg:boolean)=>void,
 *  isMounted:()=>boolean
 * })}} init
 */
module.exports.RealTimeBackup = () => {
  return {
    create: RealtimeBackup.init.bind(RealtimeBackup),
  };
}
