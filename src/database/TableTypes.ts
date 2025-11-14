import { TSizeOption } from "../bot/Types"

export type TTableUserData = {
    id?: number
    telegram_id: number
    username: string
    is_bot: boolean
    last_name?: string | null
    first_name?: string | null
    links?: any
}

export type TTableLinkData = {
    url: string
    available_params: TSizeOption[]
    selected_params?: TSizeOption[]
    is_active?: boolean,
    chat_id: number
}

export type TTablePollData = {
    poll_id: string,
    chat_id: number,
    options: string[],
    url: string
}