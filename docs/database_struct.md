## 表结构

### book_user_custom_fields（自定义表主表）
- 表结构
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "created_user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "app_code",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "extended_field",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "amount",
    "data_type": "bigint",
    "is_nullable": "YES",
    "column_default": "0"
  },
  {
    "column_name": "post_ids",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "is_deleted",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "NO",
    "column_default": "now()"
  },
  {
    "column_name": "visibility",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  },
  {
    "column_name": "is_public",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "column_name": "example_data",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "readme",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "table_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "source",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "note_ids",
    "data_type": "ARRAY",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "is_deletable",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "true"
  }
]

- 索引信息
[
  {
    "indexname": "book_user_custom_fields_pkey",
    "indexdef": "CREATE UNIQUE INDEX book_user_custom_fields_pkey ON public.book_user_custom_fields USING btree (id)"
  },
  {
    "indexname": "idx_book_user_custom_fields_user_id",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_user_id ON public.book_user_custom_fields USING btree (user_id)"
  },
  {
    "indexname": "idx_book_user_custom_fields_app_code",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_app_code ON public.book_user_custom_fields USING btree (app_code)"
  },
  {
    "indexname": "idx_book_user_custom_fields_is_deleted",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_is_deleted ON public.book_user_custom_fields USING btree (is_deleted)"
  },
  {
    "indexname": "idx_book_user_custom_fields_extended_field_gin",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_extended_field_gin ON public.book_user_custom_fields USING gin (extended_field)"
  },
  {
    "indexname": "idx_book_user_custom_fields_post_ids_gin",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_post_ids_gin ON public.book_user_custom_fields USING gin (post_ids)"
  },
  {
    "indexname": "idx_book_user_custom_fields_type",
    "indexdef": "CREATE INDEX idx_book_user_custom_fields_type ON public.book_user_custom_fields USING btree (type)"
  }
]

### user_profiles(查询用户相关信息)
- 表结构
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "user_type",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'user'::text"
  },
  {
    "column_name": "current_organization_id",
    "data_type": "uuid",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "display_name",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": "'active'::text"
  },
  {
    "column_name": "raw_user_meta_data",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'{}'::jsonb"
  }
]

- 索引信息
[
  {
    "indexname": "idx_user_profiles_raw_user_meta_data_gin",
    "indexdef": "CREATE INDEX idx_user_profiles_raw_user_meta_data_gin ON public.user_profiles USING gin (raw_user_meta_data)"
  },
  {
    "indexname": "user_profiles_pkey",
    "indexdef": "CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)"
  },
  {
    "indexname": "user_profiles_user_id_key",
    "indexdef": "CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles USING btree (user_id)"
  },
  {
    "indexname": "idx_user_profiles_user_id",
    "indexdef": "CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id)"
  },
  {
    "indexname": "idx_user_profiles_user_type",
    "indexdef": "CREATE INDEX idx_user_profiles_user_type ON public.user_profiles USING btree (user_type)"
  },
  {
    "indexname": "idx_user_profiles_current_organization",
    "indexdef": "CREATE INDEX idx_user_profiles_current_organization ON public.user_profiles USING btree (current_organization_id)"
  },
  {
    "indexname": "idx_user_profiles_status",
    "indexdef": "CREATE INDEX idx_user_profiles_status ON public.user_profiles USING btree (status)"
  }
]