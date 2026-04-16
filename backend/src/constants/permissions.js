const PERMISSIONS = {
    MANAGE_WORKSPACE: 'manage_workspace',
    CREATE_BOARD: 'create_board',
    UPDATE_BOARD: 'update_board',
    DELETE_BOARD: 'delete_board',
    CREATE_TASK: 'create_task',
    UPDATE_TASK: 'update_task',
    DELETE_TASK: 'delete_task',
    COMMENT_TASK: 'comment_task',
    VIEW_CONTENT: 'view_content',
    READ_ANALYTICS: 'read_analytics'
};

// Map Roles to Capabilities
// This allows you to change what a "Member" can do without rewriting every route.
const ROLE_PERMISSIONS = {
    admin: Object.values(PERMISSIONS), // Admins can do everything
    member: [
        PERMISSIONS.CREATE_BOARD,
        PERMISSIONS.UPDATE_BOARD,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.UPDATE_TASK,
        PERMISSIONS.DELETE_TASK,
        PERMISSIONS.COMMENT_TASK,
        PERMISSIONS.VIEW_CONTENT,
        PERMISSIONS.READ_ANALYTICS
    ],
    viewer: [
        PERMISSIONS.COMMENT_TASK,
        PERMISSIONS.VIEW_CONTENT,
        PERMISSIONS.READ_ANALYTICS
    ]
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS };