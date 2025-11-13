import * as fs from 'fs';
import * as path from 'path';
import { Faction } from '../model/event/Faction';
import { log, LOG_LEVEL } from '../utils/LogUtils';
import { DbModel } from './dbModel';

export class IoManager {
    private constructor() { }

    private static readonly projectRoot = process.cwd();
    private static readonly srcPath = path.join(IoManager.projectRoot, 'src');
    private static readonly stateDbFilePath = path.join(IoManager.srcPath, 'database', 'json', 'db.json');
    private static readonly logFileFolder = path.join(IoManager.srcPath, 'logs');
    private static readonly logFilePath = path.join(IoManager.logFileFolder, 'log.txt');

    private static isWriting = false;
    private static readonly writeQueue: Array<() => Promise<void>> = [];

    private static async processQueue() {
        if (IoManager.isWriting || IoManager.writeQueue.length === 0) {
            return;
        }

        IoManager.isWriting = true;
        const task = IoManager.writeQueue.shift();
        if (task) {
            try {
                await task();
            } catch (error) {
                log(`Error processing write queue: ${error}`, LOG_LEVEL.ERROR);
            } finally {
                IoManager.isWriting = false;
                process.nextTick(IoManager.processQueue);
            }
        }
    }

    public static saveLog(msgContent: string) {
        // Create folder if not exist
        if (!fs.existsSync(IoManager.logFileFolder)) {
            fs.mkdirSync(IoManager.logFileFolder);
        }

        // Create file if not exist
        if (!fs.existsSync(IoManager.logFilePath)) {
            fs.writeFileSync(IoManager.logFilePath, "", 'utf-8');
        }

        fs.appendFileSync(IoManager.logFilePath, msgContent + "\n", 'utf-8');
    }

    public static writeInDb(dbObject: DbModel) {
        log("Update DB", LOG_LEVEL.DATABASE)
        IoManager.writeQueue.push(async () => fs.writeFileSync(IoManager.stateDbFilePath, JSON.stringify(dbObject, null, 2), 'utf-8'));
        IoManager.processQueue();
    }

    public static getDbData(): DbModel {
        log("Whole database requested !", LOG_LEVEL.DATABASE)
        const dbObj: DbModel = JSON.parse(fs.readFileSync(IoManager.stateDbFilePath, 'utf-8'));
        // Create Faction class for each Event
        dbObj.events.forEach(event => {
            event.factions = event.factions.map(faction =>
                Faction.fromJson(faction)
            );
        });

        return dbObj;
    }

    /**
     * Downloads a file from a given URL and saves it to the "download" directory.
     * @param fileName The name of the file to save.
     * @param url The URL to download the file from.
     * @returns The path to the downloaded file.
     */
    public static async downloadFile(fileName: string, url: string): Promise<string> {
        const downloadDir = path.join(__dirname, 'download');
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir, { recursive: true });
        }
        const filePath = path.join(downloadDir, fileName);
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        return filePath;
    }

    public static async deleteFile(filePath: string): Promise<void> {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            log(`File deleted: ${filePath}`, LOG_LEVEL.INFO);
        }
    }
}
