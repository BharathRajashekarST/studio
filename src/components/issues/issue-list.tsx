
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Issue, IssuePriority, IssueStatus } from '@/lib/types';
import { issueStatuses, issuePriorities } from '@/lib/types';
import { ArrowUpDown, Edit, FilterX, ListFilter, Trash2 } from 'lucide-react'; // Added Trash2
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

interface IssueListProps {
  issues: Issue[];
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issueId: string) => void; // Added onDeleteIssue prop
}

type SortKey = keyof Issue | '';
type SortOrder = 'asc' | 'desc';

export function IssueList({ issues, onEditIssue, onDeleteIssue }: IssueListProps) {
  const [filterText, setFilterText] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<IssueStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = React.useState<IssuePriority | 'all'>('all');
  const [sortKey, setSortKey] = React.useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const filteredIssues = React.useMemo(() => {
    let tempIssues = [...issues];

    if (filterText) {
      tempIssues = tempIssues.filter(
        (issue) =>
          issue.title.toLowerCase().includes(filterText.toLowerCase()) ||
          issue.id.toLowerCase().includes(filterText.toLowerCase()) ||
          (issue.description && issue.description.toLowerCase().includes(filterText.toLowerCase()))
      );
    }

    if (filterStatus !== 'all') {
      tempIssues = tempIssues.filter((issue) => issue.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      tempIssues = tempIssues.filter((issue) => issue.priority === filterPriority);
    }
    return tempIssues;
  }, [issues, filterText, filterStatus, filterPriority]);

  const sortedIssues = React.useMemo(() => {
    if (!sortKey) return filteredIssues;

    return [...filteredIssues].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      let comparison = 0;
      if (valA === undefined && valB !== undefined) comparison = -1;
      else if (valA !== undefined && valB === undefined) comparison = 1;
      else if (valA === undefined && valB === undefined) comparison = 0;
      else if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
         // Fallback for dates or mixed types by converting to string
        comparison = String(valA).localeCompare(String(valB));
      }
      return sortOrder === 'asc' ? comparison : comparison * -1;
    });
  }, [filteredIssues, sortKey, sortOrder]);

  const getPriorityBadgeVariant = (priority: IssuePriority) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'High': return 'default'; // Primary color
      case 'Medium': return 'secondary';
      case 'Low': return 'outline';
      default: return 'outline';
    }
  };
  
  const getStatusColor = (status: IssueStatus): string => {
    switch (status) {
      case 'To Do': return 'bg-blue-500';
      case 'In Progress': return 'bg-yellow-500';
      case 'Done': return 'bg-green-500';
      case 'Backlog': return 'bg-gray-500';
      case 'Cancelled': return 'bg-red-700';
      default: return 'bg-gray-300';
    }
  };

  const resetFilters = () => {
    setFilterText('');
    setFilterStatus('all');
    setFilterPriority('all');
    setSortKey('createdAt');
    setSortOrder('desc');
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Issue Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <Input
            placeholder="Filter by ID, title, description..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="text-base"
            aria-label="Filter issues by text"
          />
          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as IssueStatus | 'all')}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {issueStatuses.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as IssuePriority | 'all')}>
            <SelectTrigger aria-label="Filter by priority">
              <SelectValue placeholder="Filter by Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {issuePriorities.map((priority) => (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Button onClick={resetFilters} variant="outline" className="w-full sm:w-auto">
            <FilterX className="mr-2 h-4 w-4" /> Clear Filters
          </Button>
        </div>

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: 'id', label: 'ID' },
                  { key: 'title', label: 'Title' },
                  { key: 'status', label: 'Status' },
                  { key: 'priority', label: 'Priority' },
                  { key: 'assignee', label: 'Assignee' },
                  { key: 'updatedAt', label: 'Last Updated' },
                ].map(col => (
                  <TableHead key={col.key} className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort(col.key as SortKey)}>
                    <div className="flex items-center">
                      {col.label}
                      {sortKey === col.key && <ArrowUpDown className="ml-2 h-4 w-4" />}
                    </div>
                  </TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIssues.length > 0 ? (
                sortedIssues.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-muted/20 transition-colors duration-150">
                    <TableCell className="font-medium">{issue.id}</TableCell>
                    <TableCell className="max-w-xs truncate" title={issue.title}>{issue.title}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </TableCell>
                    <TableCell>
                       <Badge variant={getPriorityBadgeVariant(issue.priority)} className="text-xs">
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{issue.assignee || 'Unassigned'}</TableCell>
                    <TableCell>{format(parseISO(issue.updatedAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => onEditIssue(issue)} aria-label={`Edit issue ${issue.id}`}>
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDeleteIssue(issue.id)} aria-label={`Delete issue ${issue.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No issues found. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
