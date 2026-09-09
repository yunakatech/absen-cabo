import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { User, Attendance, LeaveRequest, AppSettings, AuditLogEntry } from './types';
import bcrypt from 'bcryptjs';

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  company_name: 'PT Cabo Transport',
  timezone: 'Asia/Makassar',
  attendance_enabled: true,
  attendance_start_time: '05:00',
  attendance_end_time: '13:00',
  require_gps: false,
  leave_enabled: true,
  leave_reason_required: false,
  monday_enabled: true,
  tuesday_enabled: true,
  wednesday_enabled: true,
  thursday_enabled: true,
  friday_enabled: true,
  saturday_enabled: true,
  sunday_enabled: false,
};

// Initial Seed Users (PIN for all: 123456)
// Generated bcrypt hash for "123456"
const DEFAULT_PIN_HASH = '$2a$10$r9ZfFhA6E6f5S5c.pU2s7eO0S0I0d4x9Y8Z7A6B5C4D3E2F1G0H1I'; // bcrypt hash for 123456

interface DBData {
  users: User[];
  attendance: Attendance[];
  leave_requests: LeaveRequest[];
  settings: Record<string, string>;
  audit_log: AuditLogEntry[];
}

/**
 * Get pre-seeded data for fallback local storage or Google Sheets initialization
 */
export async function getDefaultSeedData(): Promise<DBData> {
  const pinHash = await bcrypt.hash('123456', 10);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'usr_admin',
        employee_code: 'ADM001',
        name: 'Admin Utama',
        phone: '08111111111',
        pin_hash: pinHash,
        role: 'ADMIN',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_spv',
        employee_code: 'SV001',
        name: 'Pak Ahmad (Supervisor)',
        phone: '08122222222',
        pin_hash: pinHash,
        role: 'SUPERVISOR',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_dr1',
        employee_code: 'DR001',
        name: 'Pak Budi',
        phone: '08133333333',
        pin_hash: pinHash,
        role: 'DRIVER',
        supervisor_id: 'usr_spv',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_dr2',
        employee_code: 'DR002',
        name: 'Pak Rahman',
        phone: '08144444444',
        pin_hash: pinHash,
        role: 'DRIVER',
        supervisor_id: 'usr_spv',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr_dr3',
        employee_code: 'DR003',
        name: 'Pak Yusuf',
        phone: '08155555555',
        pin_hash: pinHash,
        role: 'DRIVER',
        supervisor_id: 'usr_spv',
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      },
    ],
    attendance: [],
    leave_requests: [],
    settings: {
      company_name: 'PT Cabo Transport',
      timezone: 'Asia/Makassar',
      attendance_enabled: 'true',
      attendance_start_time: '05:00',
      attendance_end_time: '13:00',
      require_gps: 'false',
      leave_enabled: 'true',
      leave_reason_required: 'false',
      monday_enabled: 'true',
      tuesday_enabled: 'true',
      wednesday_enabled: 'true',
      thursday_enabled: 'true',
      friday_enabled: 'true',
      saturday_enabled: 'true',
      sunday_enabled: 'false',
    },
    audit_log: [],
  };
}

/**
 * Initialize Google Sheets Client if credentials exist
 */
function getGoogleSheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!serviceAccountJson || !spreadsheetId) {
    return null;
  }

  try {
    let credentials;
    if (serviceAccountJson.trim().startsWith('{')) {
      credentials = JSON.parse(serviceAccountJson);
    } else {
      // If base64 encoded or string path
      const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
      credentials = JSON.parse(decoded);
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    return null;
  }
}

let memoryDbCache: DBData | null = null;

function getDbFilePath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join('/tmp', 'absen_cabo_db.json');
  }
  return path.join(process.cwd(), 'data', 'db.json');
}

/**
 * Ensures local DB file exists with initial data
 */
async function ensureLocalDb(): Promise<DBData> {
  if (memoryDbCache) {
    return memoryDbCache;
  }

  const dbPath = getDbFilePath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf8');
      memoryDbCache = JSON.parse(raw);
      return memoryDbCache!;
    }
  } catch (err) {
    console.warn('File system read/mkdir warning, using memory seed:', err);
  }

  const initialData = await getDefaultSeedData();
  memoryDbCache = initialData;

  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf8');
  } catch (err) {
    console.warn('File system write warning (read-only environment):', err);
  }

  return memoryDbCache;
}

function saveLocalDb(data: DBData) {
  memoryDbCache = data;
  try {
    const dbPath = getDbFilePath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('File system saveLocalDb warning (read-only environment):', err);
  }
}

// ----------------------------------------------------
// DATABASE API (Unified Google Sheets + Fallback DB)
// ----------------------------------------------------

export const db = {
  /**
   * Check if Google Sheets API is active
   */
  isGoogleSheetsActive(): boolean {
    return getGoogleSheetsClient() !== null;
  },

  /**
   * Fetch all Users
   */
  async getUsers(): Promise<User[]> {
    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const res = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.spreadsheetId,
          range: 'Users!A2:J',
        });
        const rows = res.data.values || [];
        return rows.map((r) => ({
          id: r[0] || '',
          employee_code: r[1] || '',
          name: r[2] || '',
          phone: r[3] || '',
          pin_hash: r[4] || '',
          role: (r[5] || 'DRIVER') as User['role'],
          supervisor_id: r[6] || '',
          status: (r[7] || 'ACTIVE') as User['status'],
          created_at: r[8] || '',
          updated_at: r[9] || '',
        }));
      } catch (err) {
        console.error('Google Sheets read error (Users):', err);
      }
    }

    const localData = await ensureLocalDb();
    return localData.users;
  },

  /**
   * Get User by Phone
   */
  async getUserByPhone(phone: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.phone === phone) || null;
  },

  /**
   * Get User by ID
   */
  async getUserById(id: string): Promise<User | null> {
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  /**
   * Save (Insert or Update) User
   */
  async saveUser(user: User): Promise<User> {
    const localData = await ensureLocalDb();
    const existingIdx = localData.users.findIndex((u) => u.id === user.id);
    if (existingIdx >= 0) {
      localData.users[existingIdx] = { ...user, updated_at: new Date().toISOString() };
    } else {
      localData.users.push(user);
    }
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        // Sync full Users sheet
        const values = localData.users.map((u) => [
          u.id,
          u.employee_code,
          u.name,
          u.phone,
          u.pin_hash,
          u.role,
          u.supervisor_id || '',
          u.status,
          u.created_at,
          u.updated_at,
        ]);

        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Users!A2:J',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        console.error('Google Sheets sync error (saveUser):', err);
      }
    }

    return user;
  },

  /**
   * Delete User (Soft Delete status = INACTIVE or full delete if requested)
   */
  async deleteUser(id: string, hardDelete = false): Promise<boolean> {
    const localData = await ensureLocalDb();
    if (hardDelete) {
      localData.users = localData.users.filter((u) => u.id !== id);
    } else {
      const u = localData.users.find((u) => u.id === id);
      if (u) u.status = 'INACTIVE';
    }
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const values = localData.users.map((u) => [
          u.id,
          u.employee_code,
          u.name,
          u.phone,
          u.pin_hash,
          u.role,
          u.supervisor_id || '',
          u.status,
          u.created_at,
          u.updated_at,
        ]);
        await client.sheets.spreadsheets.values.clear({
          spreadsheetId: client.spreadsheetId,
          range: 'Users!A2:J',
        });
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Users!A2:J',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        console.error('Google Sheets sync error (deleteUser):', err);
      }
    }
    return true;
  },

  /**
   * Fetch all Attendance
   */
  async getAttendance(): Promise<Attendance[]> {
    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const res = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.spreadsheetId,
          range: 'Attendance!A2:M',
        });
        const rows = res.data.values || [];
        return rows.map((r) => ({
          id: r[0] || '',
          attendance_key: r[1] || '',
          attendance_date: r[2] || '',
          attendance_time: r[3] || '',
          driver_id: r[4] || '',
          driver_name: r[5] || '',
          latitude: r[6] || '',
          longitude: r[7] || '',
          gps_accuracy: r[8] || '',
          source: (r[9] || 'DRIVER') as Attendance['source'],
          notes: r[10] || '',
          created_at: r[11] || '',
          updated_at: r[12] || '',
        }));
      } catch (err) {
        console.error('Google Sheets read error (Attendance):', err);
      }
    }

    const localData = await ensureLocalDb();
    return localData.attendance;
  },

  /**
   * Save Attendance Record
   */
  async saveAttendance(item: Attendance): Promise<Attendance> {
    const localData = await ensureLocalDb();
    const idx = localData.attendance.findIndex((a) => a.id === item.id);
    if (idx >= 0) {
      localData.attendance[idx] = item;
    } else {
      localData.attendance.push(item);
    }
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const values = localData.attendance.map((a) => [
          a.id,
          a.attendance_key,
          a.attendance_date,
          a.attendance_time,
          a.driver_id,
          a.driver_name,
          a.latitude,
          a.longitude,
          a.gps_accuracy,
          a.source,
          a.notes,
          a.created_at,
          a.updated_at,
        ]);
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Attendance!A2:M',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        console.error('Google Sheets sync error (saveAttendance):', err);
      }
    }

    return item;
  },

  /**
   * Delete Attendance Record
   */
  async deleteAttendance(id: string): Promise<boolean> {
    const localData = await ensureLocalDb();
    localData.attendance = localData.attendance.filter((a) => a.id !== id);
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const values = localData.attendance.map((a) => [
          a.id,
          a.attendance_key,
          a.attendance_date,
          a.attendance_time,
          a.driver_id,
          a.driver_name,
          a.latitude,
          a.longitude,
          a.gps_accuracy,
          a.source,
          a.notes,
          a.created_at,
          a.updated_at,
        ]);
        await client.sheets.spreadsheets.values.clear({
          spreadsheetId: client.spreadsheetId,
          range: 'Attendance!A2:M',
        });
        if (values.length > 0) {
          await client.sheets.spreadsheets.values.update({
            spreadsheetId: client.spreadsheetId,
            range: 'Attendance!A2:M',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
          });
        }
      } catch (err) {
        console.error('Google Sheets sync error (deleteAttendance):', err);
      }
    }
    return true;
  },

  /**
   * Fetch all Leave Requests
   */
  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const res = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.spreadsheetId,
          range: 'Leave_Requests!A2:P',
        });
        const rows = res.data.values || [];
        return rows.map((r) => ({
          id: r[0] || '',
          driver_id: r[1] || '',
          driver_name: r[2] || '',
          supervisor_id: r[3] || '',
          leave_type: r[4] as LeaveRequest['leave_type'],
          start_date: r[5] || '',
          end_date: r[6] || '',
          reason: r[7] || '',
          status: (r[8] || 'PENDING') as LeaveRequest['status'],
          approved_by: r[9] || '',
          approved_at: r[10] || '',
          rejected_by: r[11] || '',
          rejected_at: r[12] || '',
          rejection_reason: r[13] || '',
          created_at: r[14] || '',
          updated_at: r[15] || '',
        }));
      } catch (err) {
        console.error('Google Sheets read error (Leave_Requests):', err);
      }
    }

    const localData = await ensureLocalDb();
    return localData.leave_requests;
  },

  /**
   * Save Leave Request
   */
  async saveLeaveRequest(item: LeaveRequest): Promise<LeaveRequest> {
    const localData = await ensureLocalDb();
    const idx = localData.leave_requests.findIndex((l) => l.id === item.id);
    if (idx >= 0) {
      localData.leave_requests[idx] = item;
    } else {
      localData.leave_requests.push(item);
    }
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const values = localData.leave_requests.map((l) => [
          l.id,
          l.driver_id,
          l.driver_name,
          l.supervisor_id,
          l.leave_type,
          l.start_date,
          l.end_date,
          l.reason,
          l.status,
          l.approved_by || '',
          l.approved_at || '',
          l.rejected_by || '',
          l.rejected_at || '',
          l.rejection_reason || '',
          l.created_at,
          l.updated_at,
        ]);
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Leave_Requests!A2:P',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        console.error('Google Sheets sync error (saveLeaveRequest):', err);
      }
    }

    return item;
  },

  /**
   * Fetch Settings
   */
  async getSettings(): Promise<AppSettings> {
    const client = getGoogleSheetsClient();
    let rawSettings: Record<string, string> = {};

    if (client) {
      try {
        const res = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.spreadsheetId,
          range: 'Settings!A2:B',
        });
        const rows = res.data.values || [];
        rows.forEach((r) => {
          if (r[0]) rawSettings[r[0]] = r[1] ?? '';
        });
      } catch (err) {
        console.error('Google Sheets read error (Settings):', err);
      }
    }

    if (Object.keys(rawSettings).length === 0) {
      const localData = await ensureLocalDb();
      rawSettings = localData.settings;
    }

    return {
      company_name: rawSettings.company_name ?? DEFAULT_SETTINGS.company_name,
      timezone: rawSettings.timezone ?? DEFAULT_SETTINGS.timezone,
      attendance_enabled: rawSettings.attendance_enabled === 'true',
      attendance_start_time: rawSettings.attendance_start_time ?? DEFAULT_SETTINGS.attendance_start_time,
      attendance_end_time: rawSettings.attendance_end_time ?? DEFAULT_SETTINGS.attendance_end_time,
      require_gps: rawSettings.require_gps === 'true',
      leave_enabled: rawSettings.leave_enabled === 'true',
      leave_reason_required: rawSettings.leave_reason_required === 'true',
      monday_enabled: rawSettings.monday_enabled !== 'false',
      tuesday_enabled: rawSettings.tuesday_enabled !== 'false',
      wednesday_enabled: rawSettings.wednesday_enabled !== 'false',
      thursday_enabled: rawSettings.thursday_enabled !== 'false',
      friday_enabled: rawSettings.friday_enabled !== 'false',
      saturday_enabled: rawSettings.saturday_enabled !== 'false',
      sunday_enabled: rawSettings.sunday_enabled === 'true',
    };
  },

  /**
   * Save Settings
   */
  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const localData = await ensureLocalDb();
    const settingsMap: Record<string, string> = {
      company_name: settings.company_name,
      timezone: settings.timezone,
      attendance_enabled: String(settings.attendance_enabled),
      attendance_start_time: settings.attendance_start_time,
      attendance_end_time: settings.attendance_end_time,
      require_gps: String(settings.require_gps),
      leave_enabled: String(settings.leave_enabled),
      leave_reason_required: String(settings.leave_reason_required),
      monday_enabled: String(settings.monday_enabled),
      tuesday_enabled: String(settings.tuesday_enabled),
      wednesday_enabled: String(settings.wednesday_enabled),
      thursday_enabled: String(settings.thursday_enabled),
      friday_enabled: String(settings.friday_enabled),
      saturday_enabled: String(settings.saturday_enabled),
      sunday_enabled: String(settings.sunday_enabled),
    };

    localData.settings = settingsMap;
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const values = Object.entries(settingsMap).map(([key, value]) => [key, value]);
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Settings!A2:B',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values },
        });
      } catch (err) {
        console.error('Google Sheets sync error (saveSettings):', err);
      }
    }

    return settings;
  },

  /**
   * Fetch Audit Logs
   */
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const client = getGoogleSheetsClient();
    if (client) {
      try {
        const res = await client.sheets.spreadsheets.values.get({
          spreadsheetId: client.spreadsheetId,
          range: 'Audit_Log!A2:H',
        });
        const rows = res.data.values || [];
        return rows.map((r) => ({
          id: r[0] || '',
          timestamp: r[1] || '',
          user_id: r[2] || '',
          user_name: r[3] || '',
          action: r[4] || '',
          reference_id: r[5] || '',
          old_value: r[6] || '',
          new_value: r[7] || '',
        }));
      } catch (err) {
        console.error('Google Sheets read error (Audit_Log):', err);
      }
    }

    const localData = await ensureLocalDb();
    return localData.audit_log;
  },

  /**
   * Append Audit Log Entry
   */
  async logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const fullEntry: AuditLogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toISOString(),
      ...entry,
    };

    const localData = await ensureLocalDb();
    localData.audit_log.unshift(fullEntry); // newest first
    saveLocalDb(localData);

    const client = getGoogleSheetsClient();
    if (client) {
      try {
        await client.sheets.spreadsheets.values.append({
          spreadsheetId: client.spreadsheetId,
          range: 'Audit_Log!A2:H',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [
              [
                fullEntry.id,
                fullEntry.timestamp,
                fullEntry.user_id,
                fullEntry.user_name,
                fullEntry.action,
                fullEntry.reference_id,
                fullEntry.old_value || '',
                fullEntry.new_value || '',
              ],
            ],
          },
        });
      } catch (err) {
        console.error('Google Sheets sync error (logAudit):', err);
      }
    }

    return fullEntry;
  },

  /**
   * Initialize Google Spreadsheet Tabs and Header Rows
   */
  async setupGoogleSheets(): Promise<{ success: boolean; message: string }> {
    const client = getGoogleSheetsClient();
    if (!client) {
      return {
        success: false,
        message: 'Google Service Account or Spreadsheet ID not configured in .env.local',
      };
    }

    try {
      const headers = {
        Users: [
          'id',
          'employee_code',
          'name',
          'phone',
          'pin_hash',
          'role',
          'supervisor_id',
          'status',
          'created_at',
          'updated_at',
        ],
        Attendance: [
          'id',
          'attendance_key',
          'attendance_date',
          'attendance_time',
          'driver_id',
          'driver_name',
          'latitude',
          'longitude',
          'gps_accuracy',
          'source',
          'notes',
          'created_at',
          'updated_at',
        ],
        Leave_Requests: [
          'id',
          'driver_id',
          'driver_name',
          'supervisor_id',
          'leave_type',
          'start_date',
          'end_date',
          'reason',
          'status',
          'approved_by',
          'approved_at',
          'rejected_by',
          'rejected_at',
          'rejection_reason',
          'created_at',
          'updated_at',
        ],
        Settings: ['key', 'value'],
        Audit_Log: [
          'id',
          'timestamp',
          'user_id',
          'user_name',
          'action',
          'reference_id',
          'old_value',
          'new_value',
        ],
      };

      // 1. Fetch current spreadsheet info to check existing tab names
      const spreadsheetInfo = await client.sheets.spreadsheets.get({
        spreadsheetId: client.spreadsheetId,
      });

      const existingTabNames = (spreadsheetInfo.data.sheets || [])
        .map((s) => s.properties?.title)
        .filter((t): t is string => Boolean(t));

      // 2. Automatically create missing tabs via batchUpdate
      const addSheetRequests = Object.keys(headers)
        .filter((sheetName) => !existingTabNames.includes(sheetName))
        .map((sheetName) => ({
          addSheet: {
            properties: { title: sheetName },
          },
        }));

      if (addSheetRequests.length > 0) {
        await client.sheets.spreadsheets.batchUpdate({
          spreadsheetId: client.spreadsheetId,
          requestBody: { requests: addSheetRequests },
        });
      }

      // 3. Write header rows for each tab
      for (const [sheetName, cols] of Object.entries(headers)) {
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: `${sheetName}!A1:${String.fromCharCode(65 + cols.length - 1)}1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [cols] },
        });
      }

      // 4. Seed initial default users if Users sheet is empty
      const usersRes = await client.sheets.spreadsheets.values.get({
        spreadsheetId: client.spreadsheetId,
        range: 'Users!A2:J',
      });
      const userRows = usersRes.data.values || [];
      if (userRows.length === 0) {
        const seedData = await getDefaultSeedData();
        const userValues = seedData.users.map((u) => [
          u.id,
          u.employee_code,
          u.name,
          u.phone,
          u.pin_hash,
          u.role,
          u.supervisor_id || '',
          u.status,
          u.created_at,
          u.updated_at,
        ]);
        await client.sheets.spreadsheets.values.update({
          spreadsheetId: client.spreadsheetId,
          range: 'Users!A2:J',
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: userValues },
        });
      }

      // 5. Seed default settings
      const currentSettings = await this.getSettings();
      await this.saveSettings(currentSettings);

      return {
        success: true,
        message: 'Google Spreadsheet tabs, headers, and seed users initialized successfully!',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Failed to setup Google Sheets:', err);
      return { success: false, message: `Error setting up Google Sheets: ${errMsg}` };
    }
  },
};
