const workspace = require('../models/workSpace');
const {ROLEPERMISSIONS} = require('../config/rolePermissions');

const checkPermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // 1. get user id and workspace id from request
            const userId = req.user.id;
            const workspaceId = req.params;

            if(!workspaceId) {
                return res.status(400).json({ message: 'Workspace context is missing from URL' });
            }

            // 2. fetch workspace details
            const workspace = await workspace.findOne({
                _id: workspaceId,
                'members.user': userId},
                {'members.$': 1}
            );
            
            if(!workspace || workspace.members.length === 0) {
                return res.status(403).json({ message: 'Access denied: Not a member of the workspace' });
            }

            // 3. resolve role
            const userRole = workspace.members[0].role;

            // 4. check permissions
            const permissions = ROLEPERMISSIONS[userRole];
            if(permissions.includes(requiredPermission)) {
                return next();
            } else {
                return res.status(403).json({ message: `Access Denied: Role '${memberRole}' lacks permission '${requiredPermission}'` });
            }
        } catch (err) {
            console.error('RBAC Middleware Error:', err);
            return res.status(500).json({ message: 'Internal Authorization Error' });
        }
    }
};

module.exports = { checkPermission };