CREATE INDEX `role_organization_id_idx` ON `role` (`organization_id`);--> statement-breakpoint
CREATE INDEX `role_name_organization_id_unique_idx` ON `role` (`name`,`organization_id`);