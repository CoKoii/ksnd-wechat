const data = {
  userTypeList:[
    {id: '10001001', value: 'system',  label: '系统用户'},
    {id: '10001002', value: 'leader',  label: '领导'},
    {id: '10001003', value: 'grid_staff',  label: '网格安全员'},
    {id: '10001004', value: 'proj_staff',  label: '项目安全员'},
    {id: '10001005', value: 'shop',  label: '商铺用户'},
    {id: '10001006', value: '3th_staff',  label: '第三方安全员'},
    {id: '10001007', value: 'construction',  label: '施工备案'},
    {id: '10001008', value: 'visitor',  label: '游客身份'},
  ],
  roles: [
    {id: '2', value: 'sysAdmin', label: '系统管理员'},
    {id: '3', value: 'superAdmin', label: '超级管理员'},
    {id: '4', value: 'saler', label: '销售'},
    {id: '5', value: 'officeStaff', label: '内勤'},
    {id: '7', value: 'salesDirector', label: '销售总监'},
    {id: '8', value: 'dataAdmin', label: '数据管理员'},
    {id: '10', value: 'customer', label: '客户'},
    {id: '11', value: 'manager', label: '经理'}
  ],
  actions: [
    {id: 0, value: 'Submit', label:'提交'},
    {id: 1, value: 'Reject', label:'驳回'},
    {id: 2, value: 'HandIn', label:'上呈'},
    {id: 4, value: 'Recosign', label:'征询意见'},
    {id: 5, value: 'Hold', label:'保留'},
    {id: 6, value: 'Void', label:'删除'},
    {id: 7, value: 'Save', label:'保存'},
    {id: 9, value: 'Recall', label:'收回'},
    {id: 11, value: 'HandOver', label:'交办'},
  ],
  langs:{
    en:{
      homepage:'Home Page',
      placeOrder:'Place Order',
      mine:'Mine'
    },
    zh:{
      homepage:'首页',
      placeOrder:'我要下单',
      mine:'我的'
    }
  }
}

module.exports = data;