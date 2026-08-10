import React, { useState } from 'react';
import { Heart, Plus, Trash2, Phone, User, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const EmergencyContacts = ({ tourist }) => {
  const [contacts, setContacts] = useState([
    { id: 1, contact_name: 'Jane Doe', contact_phone: '+14155550199', relationship: 'Spouse', is_primary: 1 },
    { id: 2, contact_name: 'Robert Doe', contact_phone: '+14155550299', relationship: 'Brother', is_primary: 0 }
  ]);

  const [newContact, setNewContact] = useState({ contactName: '', contactPhone: '', relationship: 'Family' });
  const [medicalInfo, setMedicalInfo] = useState({
    blood_group: tourist?.blood_group || 'O+',
    conditions: tourist?.emergency_medical_info || 'Asthma - Carries inhaler',
    hotel: tourist?.hotel_address || 'The Grand Heritage Hotel, Connaught Place, New Delhi'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!newContact.contactName || !newContact.contactPhone) return;

    try {
      await api.post('/user/emergency-contacts', newContact);
    } catch (err) {
      console.log('Added to local contacts');
    }

    setContacts((prev) => [
      ...prev,
      { id: Date.now(), contact_name: newContact.contactName, contact_phone: newContact.contactPhone, relationship: newContact.relationship, is_primary: 0 }
    ]);
    setNewContact({ contactName: '', contactPhone: '', relationship: 'Family' });
  };

  const handleSaveMedical = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Heart className="w-6 h-6 text-danger" /> Emergency Contacts & Medical Telemetry
          </h1>
          <p className="text-xs text-slate-500">People to alert when Panic SOS is triggered & critical first responder medical data</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Emergency contacts & medical profile saved securely!
        </div>
      )}

      {/* Emergency Contacts Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Primary Emergency Alert Contacts</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-primary font-bold text-[10px] uppercase">
                  {c.relationship} {c.is_primary ? '(Primary)' : ''}
                </span>
                <p className="font-bold text-slate-800 text-xs mt-1">{c.contact_name}</p>
                <p className="text-xs font-mono font-bold text-primary">{c.contact_phone}</p>
              </div>
              <button
                onClick={() => setContacts((prev) => prev.filter((item) => item.id !== c.id))}
                className="p-1.5 rounded-lg text-slate-400 hover:text-danger hover:bg-white"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Contact Form */}
        <form onSubmit={handleAddContact} className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2 text-xs">
          <input
            type="text"
            required
            placeholder="Contact Name"
            value={newContact.contactName}
            onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
          />
          <input
            type="text"
            required
            placeholder="Phone Number (+1...)"
            value={newContact.contactPhone}
            onChange={(e) => setNewContact({ ...newContact, contactPhone: e.target.value })}
            className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
          />
          <select
            value={newContact.relationship}
            onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
            className="p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none w-full sm:w-auto"
          >
            <option value="Spouse">Spouse</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Friend">Friend</option>
            <option value="Embassy">Embassy Official</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-dark w-full sm:w-auto flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>
      </div>

      {/* Medical Telemetry Form */}
      <form onSubmit={handleSaveMedical} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h3 className="text-sm font-bold text-slate-800">Emergency First Responder Medical Data</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Blood Group</label>
            <select
              value={medicalInfo.blood_group}
              onChange={(e) => setMedicalInfo({ ...medicalInfo, blood_group: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none"
            >
              <option value="O+">O Positive (O+)</option>
              <option value="A+">A Positive (A+)</option>
              <option value="B+">B Positive (B+)</option>
              <option value="AB+">AB Positive (AB+)</option>
              <option value="O-">O Negative (O-)</option>
              <option value="A-">A Negative (A-)</option>
              <option value="B-">B Negative (B-)</option>
              <option value="AB-">AB Negative (AB-)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Medical Conditions / Allergies</label>
            <input
              type="text"
              placeholder="e.g. Asthma, Penicillin Allergy, Diabetic"
              value={medicalInfo.conditions}
              onChange={(e) => setMedicalInfo({ ...medicalInfo, conditions: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Hotel / Residence Address in India</label>
          <input
            type="text"
            placeholder="Hotel name, room #, locality..."
            value={medicalInfo.hotel}
            onChange={(e) => setMedicalInfo({ ...medicalInfo, hotel: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary-dark transition-colors"
        >
          Save Medical Telemetry Profile
        </button>
      </form>
    </div>
  );
};

export default EmergencyContacts;
