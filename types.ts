
export interface ActiveProfileSession {
    name:         string;
    profile:      Profile;
    hydrometerId: string;
    hydrometer:   Hydrometer;
    startDate:    Date;
    modifiedOn:   Date;
    modifiedBy:   string;
    id:           string;
    deleted:      boolean;
    createdOn:    Date;
    createdBy:    string;
}

export interface Hydrometer {
    temperature:           number;
    gravity:               number;
    firmwareVersion?:      string;
    battery:               number;
    activeProfileSession?: ActiveProfileSession;
    lastActivityTime?:     Date;
    rssi:                  number;
    name:                  string;
    macAddress:            string;
    deviceType:            string;
    active:                boolean;
    disabled:              boolean;
    modifiedOn:            Date;
    modifiedBy:            string;
    id:                    string;
    deleted:               boolean;
    createdOn:             Date;
    createdBy:             string;
}

export interface Profile {
    modifiedOn: Date;
    modifiedBy: string;
    id:         string;
    deleted:    boolean;
    createdOn:  Date;
    createdBy:  string;
}


export type GetHydrometersResult = Array<Hydrometer>


export interface BrewfatherCustomSteamPayload {
    name:          string;
    temp?:          number;
    aux_temp?:      number;
    ext_temp?:      number;
    temp_unit?:     string;
    gravity?:       number;
    gravity_unit?:  string;
    pressure?:      number;
    pressure_unit?: string;
    ph?:            number;
    bpm?:           number;
    comment?:       string;
    beer?:          string;
    battery?:       number;
}
