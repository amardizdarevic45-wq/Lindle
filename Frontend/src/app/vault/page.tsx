'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';

enum PreferenceLevel {
  PREFERRED = 'preferred',
  LESS_PREFERRED = 'less_preferred',
  NEUTRAL = 'neutral'
}

interface Clause {
  id: string;
  title: string;
  content: string;
  tags: string[];
  preference_level: PreferenceLevel;
  created_at: string;
  updated_at: string;
}

interface ClauseCategory {
  id: string;
  name: string;
  description?: string;
  clauses: Clause[];
  created_at: string;
  updated_at: string;
}

interface SharingSettings {
  is_public: boolean;
  shared_with_users: string[];
}

interface VaultData {
  user_id: string;
  clause_categories: ClauseCategory[];
  sharing_settings: SharingSettings;
  created_at: string;
  updated_at: string;
}

interface VaultResponse {
  vault: VaultData;
  success: boolean;
  message?: string;
}

interface ClauseResponse {
  clause: Clause;
  success: boolean;
  message?: string;
}

interface CategoryResponse {
  category: ClauseCategory;
  success: boolean;
  message?: string;
}

export default function VaultPage() {
  const [vault, setVault] = useState<VaultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState(0);
  const [showAddClause, setShowAddClause] = useState<{ categoryId: string; index: number } | null>(null);
  const [showEditClause, setShowEditClause] = useState<{ categoryId: string; clauseId: string } | null>(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states for new/edit clause
  const [clauseForm, setClauseForm] = useState({
    title: '',
    content: '',
    tags: '',
    preference_level: PreferenceLevel.NEUTRAL
  });
  
  // Form state for new category
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  });
  
  // Sharing settings
  const [isPublic, setIsPublic] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<string>('');
  
  // Current user (in a real app, this would come from authentication)
  const userId = 'demo_user';

  useEffect(() => {
    loadVault();
  }, []);

  const loadVault = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}`);
      if (!response.ok) throw new Error('Failed to load vault');
      
      const data: VaultResponse = await response.json();
      setVault(data.vault);
      setIsPublic(data.vault.sharing_settings.is_public);
      setSharedUsers(data.vault.sharing_settings.shared_with_users.join(', '));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
    } finally {
      setLoading(false);
    }
  };

  const createClause = async (categoryId: string) => {
    if (!clauseForm.title.trim() || !clauseForm.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tags = clauseForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`http://localhost:8000/vault/${userId}/categories/${categoryId}/clauses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: clauseForm.title,
          content: clauseForm.content,
          tags,
          preference_level: clauseForm.preference_level
        })
      });
      
      if (!response.ok) throw new Error('Failed to create clause');
      
      const data: ClauseResponse = await response.json();
      setSuccess('Clause created successfully!');
      setShowAddClause(null);
      setClauseForm({ title: '', content: '', tags: '', preference_level: PreferenceLevel.NEUTRAL });
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create clause');
    } finally {
      setLoading(false);
    }
  };

  const updateClause = async (categoryId: string, clauseId: string) => {
    if (!clauseForm.title.trim() || !clauseForm.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const tags = clauseForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const response = await fetch(`http://localhost:8000/vault/${userId}/categories/${categoryId}/clauses/${clauseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: clauseForm.title,
          content: clauseForm.content,
          tags,
          preference_level: clauseForm.preference_level
        })
      });
      
      if (!response.ok) throw new Error('Failed to update clause');
      
      const data: ClauseResponse = await response.json();
      setSuccess('Clause updated successfully!');
      setShowEditClause(null);
      setClauseForm({ title: '', content: '', tags: '', preference_level: PreferenceLevel.NEUTRAL });
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update clause');
    } finally {
      setLoading(false);
    }
  };

  const deleteClause = async (categoryId: string, clauseId: string) => {
    if (!confirm('Are you sure you want to delete this clause?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}/categories/${categoryId}/clauses/${clauseId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete clause');
      
      setSuccess('Clause deleted successfully!');
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete clause');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!categoryForm.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description
        })
      });
      
      if (!response.ok) throw new Error('Failed to create category');
      
      const data: CategoryResponse = await response.json();
      setSuccess('Category created successfully!');
      setShowAddCategory(false);
      setCategoryForm({ name: '', description: '' });
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category and all its clauses?')) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}/categories/${categoryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete category');
      
      setSuccess('Category deleted successfully!');
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const updateSharingSettings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/vault/${userId}/share`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_public: isPublic,
          shared_with_users: sharedUsers.split(',').map(u => u.trim()).filter(u => u)
        })
      });
      
      if (!response.ok) throw new Error('Failed to update sharing settings');
      
      setSuccess('Sharing settings updated successfully!');
      loadVault();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sharing settings');
    } finally {
      setLoading(false);
    }
  };

  const copyClauseText = (clause: Clause) => {
    navigator.clipboard.writeText(clause.content).then(() => {
      setSuccess('Clause text copied to clipboard!');
      setTimeout(() => setSuccess(null), 2000);
    }).catch(() => {
      setError('Failed to copy clause text');
      setTimeout(() => setError(null), 2000);
    });
  };

  const startEditClause = (categoryId: string, clause: Clause) => {
    setClauseForm({
      title: clause.title,
      content: clause.content,
      tags: clause.tags.join(', '),
      preference_level: clause.preference_level
    });
    setShowEditClause({ categoryId, clauseId: clause.id });
  };

  const getPreferenceBadgeColor = (level: PreferenceLevel) => {
    switch (level) {
      case PreferenceLevel.PREFERRED:
        return 'bg-green-100 text-green-800 border-green-200';
      case PreferenceLevel.LESS_PREFERRED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPreferenceBadgeText = (level: PreferenceLevel) => {
    switch (level) {
      case PreferenceLevel.PREFERRED:
        return 'Preferred';
      case PreferenceLevel.LESS_PREFERRED:
        return 'Less Preferred';
      default:
        return 'Neutral';
    }
  };

  const filteredCategories = vault?.clause_categories.filter(category =>
    searchQuery === '' || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.clauses.some(clause => 
      clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clause.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  ) || [];

  if (loading && !vault) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your Personal Clause Vault...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Clause Vault</h1>
            <p className="text-gray-600">Organize and manage your contract clauses by category with tagging and preferences.</p>
          </div>

          {/* Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clauses, titles, content, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddCategory(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Add Category
            </button>
            <button
              onClick={updateSharingSettings}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              Update Sharing
            </button>
          </div>

          {/* Add Category Modal */}
          {showAddCategory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Payment Terms"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Brief description of this category"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={createCategory}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Category'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setCategoryForm({ name: '', description: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Clause Categories */}
          <div className="space-y-6">
            {filteredCategories.map((category, categoryIndex) => (
              <div key={category.id} className="bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-600 text-sm">{category.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowAddClause({ categoryId: category.id, index: categoryIndex })}
                        className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        Add Clause
                      </button>
                      <button
                        onClick={() => deleteCategory(category.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Clauses */}
                  <div className="space-y-3">
                    {category.clauses.length === 0 ? (
                      <p className="text-gray-500 italic">No clauses yet. Add your first clause to get started!</p>
                    ) : (
                      category.clauses.map((clause) => (
                        <div key={clause.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-gray-900">{clause.title}</h3>
                                <span className={`px-2 py-1 text-xs rounded-full border ${getPreferenceBadgeColor(clause.preference_level)}`}>
                                  {getPreferenceBadgeText(clause.preference_level)}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{clause.content}</p>
                              {clause.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-xs text-gray-500 mr-1">Tags:</span>
                                  {clause.tags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <button
                                onClick={() => copyClauseText(clause)}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300 transition-colors"
                                title="Copy clause text"
                              >
                                Copy
                              </button>
                              <button
                                onClick={() => startEditClause(category.id, clause)}
                                className="px-2 py-1 bg-blue-200 text-blue-700 rounded text-xs hover:bg-blue-300 transition-colors"
                                title="Edit clause"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteClause(category.id, clause.id)}
                                className="px-2 py-1 bg-red-200 text-red-700 rounded text-xs hover:bg-red-300 transition-colors"
                                title="Delete clause"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Clause Form */}
                  {showAddClause?.categoryId === category.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-medium text-gray-900 mb-3">Add New Clause</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            value={clauseForm.title}
                            onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., NET 30 (PREFERRED)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                          <textarea
                            value={clauseForm.content}
                            onChange={(e) => setClauseForm({ ...clauseForm, content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Client shall pay all undisputed invoices within 30 days of receipt."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                          <input
                            type="text"
                            value={clauseForm.tags}
                            onChange={(e) => setClauseForm({ ...clauseForm, tags: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="payment, invoicing, standard"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Preference Level</label>
                          <select
                            value={clauseForm.preference_level}
                            onChange={(e) => setClauseForm({ ...clauseForm, preference_level: e.target.value as PreferenceLevel })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={PreferenceLevel.NEUTRAL}>Neutral</option>
                            <option value={PreferenceLevel.PREFERRED}>Preferred</option>
                            <option value={PreferenceLevel.LESS_PREFERRED}>Less Preferred</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => createClause(category.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          disabled={loading}
                        >
                          {loading ? 'Adding...' : 'Add Clause'}
                        </button>
                        <button
                          onClick={() => {
                            setShowAddClause(null);
                            setClauseForm({ title: '', content: '', tags: '', preference_level: PreferenceLevel.NEUTRAL });
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredCategories.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No clauses match your search.' : 'No categories yet. Add your first category to get started!'}
                </p>
              </div>
            )}
          </div>

          {/* Edit Clause Modal */}
          {showEditClause && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold mb-4">Edit Clause</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={clauseForm.title}
                      onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., NET 30 (PREFERRED)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    <textarea
                      value={clauseForm.content}
                      onChange={(e) => setClauseForm({ ...clauseForm, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      rows={4}
                      placeholder="Client shall pay all undisputed invoices within 30 days of receipt."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={clauseForm.tags}
                      onChange={(e) => setClauseForm({ ...clauseForm, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="payment, invoicing, standard"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preference Level</label>
                    <select
                      value={clauseForm.preference_level}
                      onChange={(e) => setClauseForm({ ...clauseForm, preference_level: e.target.value as PreferenceLevel })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={PreferenceLevel.NEUTRAL}>Neutral</option>
                      <option value={PreferenceLevel.PREFERRED}>Preferred</option>
                      <option value={PreferenceLevel.LESS_PREFERRED}>Less Preferred</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => updateClause(showEditClause.categoryId, showEditClause.clauseId)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Clause'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditClause(null);
                      setClauseForm({ title: '', content: '', tags: '', preference_level: PreferenceLevel.NEUTRAL });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sharing Settings */}
          <div className="mt-8 bg-white/70 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sharing Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="public" className="ml-2 block text-sm text-gray-900">
                  Make clause vault publicly visible
                </label>
              </div>
              
              <div>
                <label htmlFor="shared-users" className="block text-sm font-medium text-gray-700">
                  Share with specific users (comma-separated user IDs)
                </label>
                <input
                  id="shared-users"
                  type="text"
                  value={sharedUsers}
                  onChange={(e) => setSharedUsers(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="partner_user, team_lead"
                />
              </div>
            </div>
          </div>

          {vault && (
            <div className="mt-6 text-xs text-gray-500">
              <p>Last updated: {new Date(vault.updated_at).toLocaleString()}</p>
              <p>Created: {new Date(vault.created_at).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
