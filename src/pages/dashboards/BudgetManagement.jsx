import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { DollarSign, PlusCircle } from 'lucide-react';

const BudgetManagement = () => {
  const { user } = useContext(AuthContext);
  const [budgets, setBudgets] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  
  const [newBudget, setNewBudget] = useState({ title: '', amount: '', is_expense: true });
  const [newSponsor, setNewSponsor] = useState({ sponsor_name: '', amount: '' });

  const fetchData = async () => {
    try {
      if (!user?.society) return;
      const bRes = await api.get('budgets/');
      setBudgets(bRes.data.filter(b => b.society === user.society));
      const sRes = await api.get('sponsorships/');
      setSponsorships(sRes.data.filter(s => s.society === user.society));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post('budgets/', { ...newBudget, society: user.society });
      setNewBudget({ title: '', amount: '', is_expense: true });
      fetchData();
    } catch (e) { alert("Failed to add budget item."); }
  };

  const handleAddSponsor = async (e) => {
    e.preventDefault();
    try {
      await api.post('sponsorships/', { ...newSponsor, society: user.society });
      setNewSponsor({ sponsor_name: '', amount: '' });
      fetchData();
    } catch (e) { alert("Failed to add sponsorship."); }
  };

  const totalSponsorship = sponsorships.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  const totalExpense = budgets.filter(b => b.is_expense).reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const totalIncome = budgets.filter(b => !b.is_expense).reduce((sum, b) => sum + parseFloat(b.amount), 0);
  const balance = totalIncome + totalSponsorship - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 mb-8">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><DollarSign size={28} /></div>
          Budget & Sponsorships
        </h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Total Income</p>
            <p className="text-3xl font-extrabold text-slate-900">PKR {totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Sponsorships</p>
            <p className="text-3xl font-extrabold text-emerald-600">PKR {totalSponsorship.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-2">Total Expenses</p>
            <p className="text-3xl font-extrabold text-red-600">PKR {totalExpense.toFixed(2)}</p>
          </div>
          <div className={`p-6 rounded-3xl border shadow-sm ${balance >= 0 ? 'bg-emerald-900 border-emerald-800' : 'bg-red-900 border-red-800'} text-white`}>
            <p className="font-bold text-sm uppercase tracking-wider mb-2 opacity-80">Current Balance</p>
            <p className="text-3xl font-extrabold">PKR {balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Ledger */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Society Ledger</h2>
            <form onSubmit={handleAddBudget} className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input required type="text" placeholder="Title" value={newBudget.title} onChange={e => setNewBudget({...newBudget, title: e.target.value})} className="flex-1 px-3 py-2 border rounded-lg" />
              <input required type="number" step="0.01" placeholder="Amount" value={newBudget.amount} onChange={e => setNewBudget({...newBudget, amount: e.target.value})} className="w-24 px-3 py-2 border rounded-lg" />
              <select value={newBudget.is_expense} onChange={e => setNewBudget({...newBudget, is_expense: e.target.value === 'true'})} className="px-3 py-2 border rounded-lg">
                <option value={true}>Expense</option>
                <option value={false}>Income</option>
              </select>
              <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-800"><PlusCircle size={20}/></button>
            </form>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {budgets.map(b => (
                <div key={b.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-800">{b.title}</span>
                  <span className={`font-bold ${b.is_expense ? 'text-red-600' : 'text-emerald-600'}`}>
                    {b.is_expense ? '-' : '+'}PKR {b.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sponsorships */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-6">Sponsors</h2>
            <form onSubmit={handleAddSponsor} className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <input required type="text" placeholder="Sponsor Name" value={newSponsor.sponsor_name} onChange={e => setNewSponsor({...newSponsor, sponsor_name: e.target.value})} className="flex-1 px-3 py-2 border rounded-lg" />
              <input required type="number" step="0.01" placeholder="Amount" value={newSponsor.amount} onChange={e => setNewSponsor({...newSponsor, amount: e.target.value})} className="w-32 px-3 py-2 border rounded-lg" />
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700"><PlusCircle size={20}/></button>
            </form>

            <div className="space-y-3">
              {sponsorships.map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-emerald-50">
                  <span className="font-semibold text-emerald-900">{s.sponsor_name}</span>
                  <span className="font-bold text-emerald-700">PKR {s.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BudgetManagement;
