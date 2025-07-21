import fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import pkg from 'lodash';
const { get, set, merge, cloneDeep } = pkg;
import { CLIConfig, CLIConfigSchema, DEFAULT_CONFIG } from '../../types/config.js';
import { ConfigurationError } from '../../types/commands.js';
import { logger } from '../../utils/logger.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: CLIConfig;
  private globalConfigPath: string;
  private projectConfigPath: string;

  constructor() {
    this.globalConfigPath = path.join(os.homedir(), '.pak', 'config.json');
    this.projectConfigPath = path.join(process.cwd(), 'pak.config.json');
    this.config = DEFAULT_CONFIG;
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      await this.ensureConfigDirectories();
      await this.loadConfiguration();
      await this.validateConfiguration();
      logger.debug('Configuration manager initialized');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Failed to initialize configuration: ${message}`);
    }
  }

  private async ensureConfigDirectories(): Promise<void> {
    const globalDir = path.dirname(this.globalConfigPath);
    const agentsDir = path.join(globalDir, 'agents');

    await fs.ensureDir(globalDir);
    await fs.ensureDir(agentsDir);
    logger.debug(`Ensured config directories: ${globalDir}, ${agentsDir}`);
  }

  private async loadConfiguration(): Promise<void> {
    const defaultConfig = this.getDefaultConfig();
    const globalConfig = await this.loadConfigFile(this.globalConfigPath);
    const projectConfig = await this.loadConfigFile(this.projectConfigPath);

    this.config = this.mergeConfigs(defaultConfig, globalConfig, projectConfig);
    logger.debug('Configuration loaded and merged');
  }

  private async loadConfigFile(filePath: string): Promise<Partial<CLIConfig>> {
    try {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readJson(filePath);
        logger.debug(`Loaded config from ${filePath}`);
        return content;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to load config from ${filePath}: ${message}`);
    }
    return {};
  }

  private mergeConfigs(...configs: Partial<CLIConfig>[]): CLIConfig {
    const base = cloneDeep(DEFAULT_CONFIG);
    return configs.reduce((merged: CLIConfig, config) => {
      return merge(merged, config);
    }, base);
  }

  private async validateConfiguration(): Promise<void> {
    try {
      const result = CLIConfigSchema.safeParse(this.config);
      if (!result.success) {
        logger.warn('Configuration validation failed, using defaults');
        this.config = merge(cloneDeep(DEFAULT_CONFIG), this.config);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.warn(`Configuration validation error: ${message}`);
      this.config = cloneDeep(DEFAULT_CONFIG);
    }
  }

  private getDefaultConfig(): CLIConfig {
    return cloneDeep(DEFAULT_CONFIG);
  }

  async save(updates: Partial<CLIConfig>, scope: 'global' | 'project' = 'global'): Promise<void> {
    try {
      const targetPath = scope === 'global' ? this.globalConfigPath : this.projectConfigPath;
      const existingConfig = await this.loadConfigFile(targetPath);
      const mergedConfig = merge(existingConfig, updates);

      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeJson(targetPath, mergedConfig, { spaces: 2 });

      // Reload configuration after save
      await this.loadConfiguration();
      logger.debug(`Configuration saved to ${scope} scope`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Failed to save configuration: ${message}`);
    }
  }

  get<T = any>(key: string): T {
    const value = get(this.config, key);
    logger.logConfig(key, value);
    return value;
  }

  async set(key: string, value: any, scope: 'global' | 'project' = 'global'): Promise<void> {
    const updates = set({}, key, value);
    await this.save(updates, scope);
    logger.debug(`Set config ${key} = ${JSON.stringify(value)} in ${scope} scope`);
  }

  getConfig(): CLIConfig {
    return cloneDeep(this.config);
  }

  async reset(scope: 'global' | 'project' = 'global'): Promise<void> {
    try {
      const targetPath = scope === 'global' ? this.globalConfigPath : this.projectConfigPath;
      
      if (await fs.pathExists(targetPath)) {
        await fs.remove(targetPath);
        logger.info(`Reset ${scope} configuration`);
      }

      // Reload configuration after reset
      await this.loadConfiguration();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Failed to reset configuration: ${message}`);
    }
  }

  async export(filePath: string): Promise<void> {
    try {
      await fs.writeJson(filePath, this.config, { spaces: 2 });
      logger.success(`Configuration exported to ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Failed to export configuration: ${message}`);
    }
  }

  async import(filePath: string, scope: 'global' | 'project' = 'global'): Promise<void> {
    try {
      if (!(await fs.pathExists(filePath))) {
        throw new Error(`Configuration file not found: ${filePath}`);
      }

      const importedConfig = await fs.readJson(filePath);
      const result = CLIConfigSchema.safeParse(importedConfig);
      
      if (!result.success) {
        throw new Error(`Invalid configuration format: ${result.error.message}`);
      }

      await this.save(importedConfig, scope);
      logger.success(`Configuration imported from ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ConfigurationError(`Failed to import configuration: ${message}`);
    }
  }

  listAll(): Record<string, any> {
    return this.flattenConfig(this.config);
  }

  private flattenConfig(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenConfig(value, newKey));
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  async validate(): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Validate configuration schema
      const result = CLIConfigSchema.safeParse(this.config);
      if (!result.success) {
        errors.push(...result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
      }

      // Validate file paths exist
      const agentsPath = this.expandPath(this.config.agents.storageLocation);
      if (!(await fs.pathExists(agentsPath))) {
        errors.push(`Agents storage location does not exist: ${agentsPath}`);
      }

      // Validate LLM provider configurations
      if (this.config.llm.defaultProvider === 'openai' && !this.config.llm.openai?.apiKey) {
        errors.push('OpenAI API key is required when using OpenAI as default provider');
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`Validation error: ${message}`);
      return { valid: false, errors };
    }
  }

  private expandPath(filePath: string): string {
    if (filePath.startsWith('~/')) {
      return path.join(os.homedir(), filePath.slice(2));
    }
    return path.resolve(filePath);
  }

  getGlobalConfigPath(): string {
    return this.globalConfigPath;
  }

  getProjectConfigPath(): string {
    return this.projectConfigPath;
  }
}

// Export singleton instance
export const configManager = ConfigManager.getInstance();
