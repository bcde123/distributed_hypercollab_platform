const PERMISSIONS = {
    MANAGE_WORKSPACE: 'manage_workspace',
    CREATE_BOARD: 'create_board',
    DELETE_BOARD: 'delete_board',
    CREATE_TASK: 'create_task',
    COMMENT_TASK: 'comment_task',
    VIEW_CONTENT: 'view_content'
};

// Map Roles to Capabilities
// This allows you to change what a "Member" can do without rewriting every route.
const ROLE_PERMISSIONS = {
    admin: Object.values(PERMISSIONS), // Admins can do everything
    member: [
        PERMISSIONS.CREATE_BOARD,
        PERMISSIONS.CREATE_TASK,
        PERMISSIONS.COMMENT_TASK,
        PERMISSIONS.VIEW_CONTENT
    ],
    viewer: [
        PERMISSIONS.COMMENT_TASK,
        PERMISSIONS.VIEW_CONTENT
    ]
};

module.exports = { PERMISSIONS, ROLE_PERMISSIONS };