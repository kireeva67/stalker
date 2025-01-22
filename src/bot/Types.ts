export type TPollAnswer = {
    poll_id: string,
    user: TUser,
    option_ids: number[]
}

export type TUserAndLangCode = {
    language_code: string
} & TUser

export type TUser = {
    id: number;                  
    is_bot: boolean;             
    first_name: string;        
    last_name?: string;           
    username?: string;   
}

export type TChat = {
    id: number;                   
    type: string;                
    title?: string;           
    username?: string;       
    first_name?: string;     
    last_name?: string; 
}

export type TPullMessage = {
    message_id: number,
    chat: TChat,
    date: Date,
    poll: TPoll
}

export type TPoll = {
    id: string;                   
    question: string;             
    options: Option[];
    total_voter_count: number;   
    is_closed: boolean;         
    is_anonymous: boolean;        
    type: string;                
    allows_multiple_answers: boolean;
}

export type TSizeOption = {
    size: string,
    available: boolean
}

export type Message = {
    message_id: number;               
    date: number;                     
    chat: TChat;
    from?: TUser;
    poll?: TPoll;
    text?: string;                
};

type Option = {                   
    text: string;            
    voter_count: number;    
}