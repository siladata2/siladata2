import mongoose from 'mongoose';

// MongoDB URI
const DEFAULT_MONGODB_URI = 'mongodb+srv://sila_md:sila0022@sila.67mxtd7.mongodb.net/sila_vcf';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

// Connect to MongoDB
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
    // Initialize settings if they do not exist
    await initializeSettings();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Schemas
const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  ip: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' },
  createdAt: { type: Date, default: Date.now }
});

const VisitSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, default: 'Unknown' },
  country: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Unknown' }
});

const BatchSchema = new mongoose.Schema({
  batchNumber: { type: Number, required: true },
  filename: { type: String, required: true },
  contactsCount: { type: Number, required: true },
  vcfData: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  downloadThreshold: { type: Number, default: 100 },
  whatsappGroupUrl: { type: String, default: 'https://chat.whatsapp.com/IS276Wg9zcuCnJRiMDI64g' },
  whatsappChannelUrl: { type: String, default: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02' },
  adminPin: { type: String, default: 'silaoo22' }, // Secret admin PIN
  currentCounter: { type: Number, default: 0 }
});

// Models
export const ContactModel = (mongoose.models.Contact || mongoose.model('Contact', ContactSchema)) as any;
export const VisitModel = (mongoose.models.Visit || mongoose.model('Visit', VisitSchema)) as any;
export const BatchModel = (mongoose.models.Batch || mongoose.model('Batch', BatchSchema)) as any;
export const SettingsModel = (mongoose.models.Settings || mongoose.model('Settings', SettingsSchema)) as any;

// Initial settings helper
async function initializeSettings() {
  try {
    const settingsCount = await SettingsModel.countDocuments();
    const defaultPin = process.env.ADMIN_PIN || 'silaoo22';
    if (settingsCount === 0) {
      await SettingsModel.create({
        downloadThreshold: 100,
        whatsappGroupUrl: 'https://chat.whatsapp.com/IS276Wg9zcuCnJRiMDI64g',
        whatsappChannelUrl: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
        adminPin: defaultPin,
        currentCounter: 0
      });
      console.log('Default settings initialized.');
    } else {
      // If there are existing settings, ensure the '1234' pin gets migrated to the secure default 'silaoo22'
      const existing = await SettingsModel.findOne();
      if (existing && (existing.adminPin === '1234' || !existing.adminPin)) {
        existing.adminPin = defaultPin;
        await existing.save();
        console.log('Settings migrated from old admin pin.');
      }
    }
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
}
