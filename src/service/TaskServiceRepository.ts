import {Injectable} from "@angular/core";
import {ITaskService} from "./ITaskService";
import {Observable} from "rxjs";
import {Task} from "../models/Task";
import {RemoteTaskService} from "./RemoteTaskService";
import {LocalTaskService} from "./LocalTaskService";
import {Http} from "@angular/http";

/**
 * Created by nico on 24.06.17.
 */


@Injectable()
export class TaskServiceRepository implements ITaskService{


    public data: any;
    public offline;
    public online;
    public taskService: ITaskService;
    public onlineState=false;

    constructor(public remoteTaskService: RemoteTaskService, public localTaskService: LocalTaskService, public http: Http) {
        this.offline = Observable.fromEvent(window, "offline");
        this.online = Observable.fromEvent(window, "online");
        this.taskService = remoteTaskService;
        this.online.subscribe(() => {
            this.taskService = remoteTaskService;
            console.log("online!");
            this.onlineState = true;
            this.sync();
        });
        this.offline.subscribe(() => {
            this.taskService = localTaskService;
            this.onlineState = false;
            console.log("offline!");
        });
    }

    all(): Observable<Array<Task>> {
        if (this.onlineState){
            this.sync()
        }
        return this.taskService.all();
    }

    add(task: Task): Observable<Number> {
        let res= this.taskService.add(task);
        if (this.onlineState){
            this.sync()
        }
        return res;
    }

    delete(task: Task): Observable<Number> {
        let res=  this.taskService.delete(task);
        if (this.onlineState){
            this.sync()
        }
        return res;
    }


    sync() {
        let localTasks ;
        this.localTaskService.all().subscribe(data => {
            localTasks = data;
        });
        let remoteTasks ;
        this.remoteTaskService.all().subscribe(data => {
            remoteTasks = data;
        });

        let mergedTasks = [new Set(remoteTasks.concat(localTasks))];

        for(var task in mergedTasks){
            if(!remoteTasks.includes(task)){
                this.remoteTaskService.add(JSON.parse(task));
            }
            if(!localTasks.includes(task)){
                this.localTaskService.add(JSON.parse(task));
            }
        }

    }

}