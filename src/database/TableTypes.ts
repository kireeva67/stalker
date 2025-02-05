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
    available_params: Map<string, boolean>
    selected_params?: Map<string, boolean>
    is_active?: boolean
}