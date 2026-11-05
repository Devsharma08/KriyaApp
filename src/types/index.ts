export type EventType = 'todo' | 'calendar' ;
export type PriorityLevel = 'low' | 'mid' | 'high' ;
export type EventStatus = 'not-started' | 'going-on' | 'completed' ;
export type MediaType = 'email' | 'phone' | 'in-person' | 'text' | 'checklist' | 'image';

export interface Section {
    id:string;
    name:string;
    iconName?:string;
    sortOrder:number;
}

export interface AppEvent {
    id:string;
    sectionId?:string;
    title:string;
    type:EventType;
    priority:PriorityLevel;
    status:EventStatus;
    startTime:string;
    endTime?:string;
    remark?:string;
    createdAt:string;
    updatedAt:string;
}
export interface NoteContentBlock {
    id:string;
    noteId:string;
    type:MediaType;
    content:string;
    blockOrder:number;
}

export interface Note {
    id:string;
    sectionId:string;
    title:string;
    label:string;
    lineCount?:number;
    contents?:NoteContentBlock[];
    createdAt:string;
    updatedAt:string;
}