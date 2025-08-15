"""
用户存储服务
支持Supabase auth.users表的查询操作
"""

import asyncio
from typing import Dict, List, Optional, Any
from supabase import Client
from utils.database.client import get_supabase_service_client
from utils.database.error_handler import DatabaseErrorHandler


class UserStorage:
    """用户信息存储服务"""
    
    def __init__(self):
        self.table_name = "users"
        self.schema = "auth"  # auth schema
        self.error_handler = DatabaseErrorHandler(self.__class__.__name__)
        self._client: Optional[Client] = None

    @property
    def client(self) -> Client:
        """获取Supabase客户端（使用服务角色绕过RLS）"""
        if self._client is None:
            self._client = get_supabase_service_client()
        return self._client

    async def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """根据用户ID查询用户信息"""
        def _get_user():
            try:
                # 首先尝试使用现有的search_users_with_auth函数
                response = self.client.rpc('search_users_with_auth', {
                    'search_term': user_id.strip(),
                    'result_limit': 1
                }).execute()
                
                if response.data and len(response.data) > 0:
                    # 查找匹配的用户ID
                    for user in response.data:
                        if user.get('user_id') == user_id.strip():
                            user_data = {
                                'id': user.get('user_id'),
                                'email': user.get('email'),
                                'phone': user.get('phone'),
                                'created_at': user.get('created_at'),
                                'updated_at': user.get('updated_at'),
                                'last_sign_in_at': user.get('last_sign_in_at'),
                                'raw_user_meta_data': user.get('raw_user_meta_data'),
                                'display_name': user.get('display_name'),
                                'avatar_url': user.get('avatar_url')
                            }
                            self.error_handler.logger.info(f"✅ 用户查询成功: {user_id} (email: {user_data.get('email', 'N/A')})")
                            return user_data
                
                # 如果search_users_with_auth找不到，尝试自定义函数
                try:
                    response = self.client.rpc('get_auth_user_by_id', {'user_id_param': user_id.strip()}).execute()
                    if response.data:
                        user_data = response.data
                        self.error_handler.logger.info(f"✅ 用户查询成功: {user_id} (email: {user_data.get('email', 'N/A')})")
                        return user_data
                except:
                    pass
                
            except Exception as e:
                self.error_handler.logger.warning(f"⚠️ search_users_with_auth函数调用失败: {e}")
                
                # 备用方案：尝试自定义函数
                try:
                    response = self.client.rpc('get_auth_user_by_id', {'user_id_param': user_id.strip()}).execute()
                    if response.data:
                        user_data = response.data
                        self.error_handler.logger.info(f"✅ 用户查询成功: {user_id} (email: {user_data.get('email', 'N/A')})")
                        return user_data
                except:
                    pass
            
            self.error_handler.logger.info(f"⚠️ 用户不存在: {user_id}")
            return None
        
        try:
            return self.error_handler.with_retry(_get_user, operation_name="用户查询")
        except Exception as e:
            self.error_handler.handle_error(e, "用户查询", {"user_id": user_id})
            return None

    async def check_user_exists(self, user_id: str) -> bool:
        """检查用户是否存在"""
        def _check_exists():
            try:
                # 使用现有的search_users_with_auth函数
                response = self.client.rpc('search_users_with_auth', {
                    'search_term': user_id.strip(),
                    'result_limit': 1
                }).execute()
                
                if response.data and len(response.data) > 0:
                    for user in response.data:
                        if user.get('user_id') == user_id.strip():
                            self.error_handler.logger.info(f"✅ 用户存在性检查: {user_id} -> 存在")
                            return True
                
                # 备用方案：尝试自定义函数
                try:
                    response = self.client.rpc('check_auth_user_exists', {'user_id_param': user_id.strip()}).execute()
                    exists = response.data if response.data is not None else False
                    if exists:
                        self.error_handler.logger.info(f"✅ 用户存在性检查: {user_id} -> 存在")
                        return True
                except:
                    pass
                    
            except Exception as e:
                self.error_handler.logger.warning(f"⚠️ 用户存在性检查失败: {e}")
            
            self.error_handler.logger.info(f"⚠️ 用户存在性检查: {user_id} -> 不存在")
            return False
        
        try:
            return self.error_handler.with_retry(_check_exists, operation_name="用户存在性检查")
        except Exception as e:
            self.error_handler.handle_error(e, "用户存在性检查", {"user_id": user_id})
            return False

    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """根据邮箱查询用户信息"""
        def _get_user_by_email():
            try:
                # 使用现有的search_users_with_auth函数
                response = self.client.rpc('search_users_with_auth', {
                    'search_term': email.strip().lower(),
                    'result_limit': 1
                }).execute()
                
                if response.data and len(response.data) > 0:
                    for user in response.data:
                        if user.get('email') and user.get('email').lower() == email.strip().lower():
                            user_data = {
                                'id': user.get('user_id'),
                                'email': user.get('email'),
                                'phone': user.get('phone'),
                                'created_at': user.get('created_at'),
                                'updated_at': user.get('updated_at'),
                                'last_sign_in_at': user.get('last_sign_in_at'),
                                'raw_user_meta_data': user.get('raw_user_meta_data'),
                                'display_name': user.get('display_name'),
                                'avatar_url': user.get('avatar_url')
                            }
                            self.error_handler.logger.info(f"✅ 用户邮箱查询成功: {email} (id: {user_data.get('id')})")
                            return user_data
                
                # 备用方案：尝试自定义函数
                try:
                    response = self.client.rpc('get_auth_user_by_email', {'email_param': email.strip().lower()}).execute()
                    if response.data:
                        user_data = response.data
                        self.error_handler.logger.info(f"✅ 用户邮箱查询成功: {email} (id: {user_data.get('id')})")
                        return user_data
                except:
                    pass
                    
            except Exception as e:
                self.error_handler.logger.warning(f"⚠️ 邮箱查询失败: {e}")
            
            self.error_handler.logger.info(f"⚠️ 用户邮箱不存在: {email}")
            return None
        
        try:
            return self.error_handler.with_retry(_get_user_by_email, operation_name="用户邮箱查询")
        except Exception as e:
            self.error_handler.handle_error(e, "用户邮箱查询", {"email": email})
            return None

    async def get_user_basic_info(self, user_id: str) -> Optional[Dict[str, Any]]:
        """获取用户基本信息（精简版）"""
        # 使用完整用户信息查询，然后提取基本字段
        full_user = await self.get_user_by_id(user_id)
        
        if full_user:
            basic_info = {
                "id": full_user.get("id"),
                "email": full_user.get("email"),
                "phone": full_user.get("phone"),
                "created_at": full_user.get("created_at"),
                "last_sign_in_at": full_user.get("last_sign_in_at")
            }
            self.error_handler.logger.info(f"✅ 用户基本信息查询成功: {user_id}")
            return basic_info
        else:
            self.error_handler.logger.info(f"⚠️ 用户基本信息查询失败: {user_id}")
            return None

    async def get_users_by_ids(self, user_ids: List[str]) -> List[Dict[str, Any]]:
        """批量查询用户信息"""
        def _get_users_batch():
            if not user_ids:
                return []
                
            # 清理和去重用户ID列表
            clean_ids = list(set([uid.strip() for uid in user_ids if uid.strip()]))
            users = []
            
            # 逐个查询用户（search_users_with_auth没有批量查询功能）
            for user_id in clean_ids:
                try:
                    response = self.client.rpc('search_users_with_auth', {
                        'search_term': user_id,
                        'result_limit': 1
                    }).execute()
                    
                    if response.data and len(response.data) > 0:
                        for user in response.data:
                            if user.get('user_id') == user_id:
                                user_data = {
                                    'id': user.get('user_id'),
                                    'email': user.get('email'),
                                    'phone': user.get('phone'),
                                    'created_at': user.get('created_at'),
                                    'updated_at': user.get('updated_at'),
                                    'last_sign_in_at': user.get('last_sign_in_at'),
                                    'raw_user_meta_data': user.get('raw_user_meta_data')
                                }
                                users.append(user_data)
                                break
                except Exception as e:
                    self.error_handler.logger.warning(f"⚠️ 批量查询单个用户失败 {user_id}: {e}")
                    continue
            
            self.error_handler.logger.info(f"✅ 批量用户查询成功: 请求{len(clean_ids)}个，找到{len(users)}个")
            return users
        
        try:
            return self.error_handler.with_retry(_get_users_batch, operation_name="批量用户查询") or []
        except Exception as e:
            self.error_handler.handle_error(e, "批量用户查询", {"user_ids_count": len(user_ids)})
            return []

    async def get_daily_new_users_count(self, target_date: str = None) -> int:
        """
        获取指定日期的新增用户数量
        
        Args:
            target_date: 目标日期，格式：YYYY-MM-DD，默认今天
            
        Returns:
            int: 新增用户数量
        """
        def _get_daily_new_users():
            try:
                if not target_date:
                    from datetime import datetime
                    target_date_str = datetime.now().strftime("%Y-%m-%d")
                else:
                    target_date_str = target_date
                
                # 使用RPC函数查询指定日期的新增用户数量
                response = self.client.rpc('get_daily_new_users_count', {
                    'target_date': target_date_str
                }).execute()
                
                count = response.data if response.data is not None else 0
                self.error_handler.logger.info(f"✅ 新增用户统计: {target_date_str} = {count}个新用户")
                return count
                
            except Exception as e:
                self.error_handler.logger.warning(f"⚠️ 新增用户统计查询失败: {e}")
                # 备用方案：直接查询（需要管理员权限）
                try:
                    start_time = f"{target_date_str}T00:00:00.000Z"
                    end_time = f"{target_date_str}T23:59:59.999Z"
                    
                    response = self.client.from_("users").select("id", count="exact").gte("created_at", start_time).lte("created_at", end_time).execute()
                    count = response.count if response.count is not None else 0
                    self.error_handler.logger.info(f"✅ 新增用户统计(备用): {target_date_str} = {count}个新用户")
                    return count
                except:
                    self.error_handler.logger.warning(f"⚠️ 新增用户统计备用方案也失败")
                    return 0
        
        try:
            return self.error_handler.with_retry(_get_daily_new_users, operation_name="新增用户统计")
        except Exception as e:
            self.error_handler.handle_error(e, "新增用户统计", {"target_date": target_date})
            return 0

    async def get_user_retention_count(self, days_back: int = 7, target_date: str = None) -> int:
        """
        获取老用户留存数量
        定义：注册时间早于目标日期，且在最近N天内有登录活动的用户数量
        
        Args:
            days_back: 留存统计的天数范围，默认7天
            target_date: 目标日期，格式：YYYY-MM-DD，默认今天
            
        Returns:
            int: 留存用户数量
        """
        def _get_retention_count():
            try:
                if not target_date:
                    from datetime import datetime
                    target_date_str = datetime.now().strftime("%Y-%m-%d")
                else:
                    target_date_str = target_date
                
                # 使用RPC函数查询用户留存数量
                response = self.client.rpc('get_user_retention_count', {
                    'target_date': target_date_str,
                    'days_back': days_back
                }).execute()
                
                count = response.data if response.data is not None else 0
                self.error_handler.logger.info(f"✅ 用户留存统计: {target_date_str} (最近{days_back}天) = {count}个留存用户")
                return count
                
            except Exception as e:
                self.error_handler.logger.warning(f"⚠️ 用户留存统计查询失败: {e}")
                # 备用方案：返回0（需要数据库函数支持）
                self.error_handler.logger.warning(f"⚠️ 用户留存统计需要数据库函数支持")
                return 0
        
        try:
            return self.error_handler.with_retry(_get_retention_count, operation_name="用户留存统计")
        except Exception as e:
            self.error_handler.handle_error(e, "用户留存统计", {"target_date": target_date, "days_back": days_back})
            return 0

    async def get_user_statistics_summary(self, target_date: str = None) -> Dict[str, int]:
        """
        获取用户统计汇总信息
        
        Args:
            target_date: 目标日期，格式：YYYY-MM-DD，默认今天
            
        Returns:
            Dict[str, int]: 用户统计汇总
        """
        try:
            if not target_date:
                from datetime import datetime
                target_date = datetime.now().strftime("%Y-%m-%d")
            
            # 并行查询各项统计
            new_users_count = await self.get_daily_new_users_count(target_date)
            retention_count = await self.get_user_retention_count(7, target_date)
            
            summary = {
                "target_date": target_date,
                "daily_new_users": new_users_count,
                "user_retention_7d": retention_count
            }
            
            self.error_handler.logger.info(f"✅ 用户统计汇总完成: {summary}")
            return summary
            
        except Exception as e:
            self.error_handler.handle_error(e, "用户统计汇总", {"target_date": target_date})
            return {
                "target_date": target_date or "unknown",
                "daily_new_users": 0,
                "user_retention_7d": 0
            } 