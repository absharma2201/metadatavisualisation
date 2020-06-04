function AppGroupUtil(groupDets) {
    var appGroups = groupDets;
    this.getGroupName = function (classid) {
        var groupNames = appGroups.trafficClassGroups;
        var classDets = appGroups.trafficClasses;
        var groupID;
        var groupName;
        classDets.some(function (d) {
            if (d.id == classid) {
                groupID = d.group_id;
                return true;
            }
        });

        if (groupID) {
            groupNames.some(function (d) {
                if (d.id == groupID) {
                    groupName = d.name;
                    return true;
                }
            });
        }
        //console.log('donut groupName ' + groupName + ' classid ' + classid);
        if (typeof groupName == 'undefined') {
//            console.log('undefined group name in map ' + classid);
        }
        return groupName;
    };

    this.getClassName = function(classid) {
        var className;
        var classDets = appGroups.trafficClasses;
        //console.log('appGroupDetails ' + JSON.stringify(classDets));
        classDets.some(function (d) {
            if (d.id == classid) {
                className = d.name;
                //console.log('class name ' + d.name);
                return true;
            }
        });

        if (typeof className == 'undefined') {
//            console.log('undefined class name in map ' + classid);
        }
        return className;
    };
}
