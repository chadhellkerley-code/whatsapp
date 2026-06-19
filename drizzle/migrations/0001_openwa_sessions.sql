ALTER TABLE `openwa_configs`
  ADD UNIQUE KEY `openwa_configs_userId_unique` (`userId`);

ALTER TABLE `whatsapp_numbers`
  ADD COLUMN `openwaSessionId` varchar(100) NULL AFTER `sessionName`;

