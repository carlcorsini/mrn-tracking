import React, { useState, useEffect } from 'react';
import { DataGrid, GridToolbar } from '@material-ui/data-grid';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import LinearProgress from '@material-ui/core/LinearProgress';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import { Grid, Typography } from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';

import { withFirebase } from '../Firebase';
import { HeadsetMic } from '@material-ui/icons';

function formatDate(date) {
  const dateObj = new Date(date + 'T00:00:00');
  return new Intl.DateTimeFormat('en-US').format(dateObj);
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const columns = [
  {
    field: 'activityType',
    description: 'Type of activity tracked',
    headerName: 'Activity Type',
    width: 160,
  },
  {
    type: 'number',
    field: 'amount',
    valueFormatter: (params) => {
      return !params.value
        ? ''
        : currencyFormatter.format(Number(params.value));
    },
    headerName: 'Amount',
    width: 130,
  },
  { field: 'note', headerName: 'Notes', width: 200 },
  {
    field: 'num_one_to_ones',
    headerName: 'One to Ones',
    description: 'Number of One to Ones',
    width: 120,
  },
  {
    field: 'num_guests',
    headerName: '# of Guests',
    width: 150,
    hide: true,
  },
  {
    field: 'member_id',
    headerName: 'Member ID',
    width: 150,
    hide: true,
  },
  { field: 'username', headerName: 'Member', width: 150 },
  {
    field: 'attendance',
    headerName: 'Attendance',
    width: 150,
    hide: true,
  },
  {
    field: 'date',
    headerName: 'Date',
    type: 'date',
    width: 120,
    // needed to replace valueFormatter with valueGetter for filtering
    valueGetter: (params) => formatDate(params.value),
    // valueFormatter: (params) => formatDate(params.value),
    sortComparator: (v1, v2, cellParams1, cellParams2) => {
      return (
        new Date(cellParams1.value) - new Date(cellParams2.value)
      );
    },
  },
  {
    field: 'createdAt',
    headerName: 'Created',
    type: 'date',
    width: 120,
    hide: true,
  },
];

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '1px solid #2f479a',
    boxShadow: theme.shadows[3],
    padding: theme.spacing(2, 4, 3),
    borderRadius: '12px',
  },
}));

const ActivityTable = ({
  activities,
  given,
  firebase,
  onListenForActivity,
  onListenForGiven,
  authUser,
  loading,
}) => {
  let today = new Date();
  today.setDate(today.getDate() - 7);
  let sevenDays = today.toISOString().slice(0, 10);
  const [selectedItem, setSelectedItem] = useState({});
  const {
    uid,
    activityType,
    note,
    amount,
    member,
    date,
    num_one_to_ones,
    num_guests,
    attendance,
  } = selectedItem;

  // ******************************************
  // *************** STATE ********************
  // ******************************************
  const [bufferGuests, setBufferGuests] = useState(num_guests);
  const [bufferNotes, setBufferNotes] = useState(note);
  const [bufferActivityType, setBufferActivityType] =
    useState(activityType);
    const [bufferAmount, setBufferAmount] =
    useState(amount);
  const classes = useStyles();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [modalStyle] = useState(getModalStyle);
  const [openEdit, setEditOpen] = useState(false);
  const [edit, setEdit] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountGiven, setTotalAmountGiven] = useState(0);
  const [totalOneToOnes, setTotalOneToOnes] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalAttendance, setTotalAttendance] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);
  // const [newNote, setNewNote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [dateRange, setDateRange] = useState(30);
  const [isFiltered, setIsFiltered] = useState(false);
  const [sortModel, setSortModel] = useState([
    {
      field: 'date',
      sort: 'desc',
    },
  ]);
  const [filterModel, setFilterModel] = useState();
  const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // ******************************************
  // *************** STATE METHODS ************
  // ******************************************

  const handleOpenDelete = () => {
    setDeleteOpen(true);
  };

  const handleCloseDelete = () => {
    setDeleteOpen(false);
  };

  const handleDelete = (uid) => {
    setSelectedItem({});
    firebase.activity(selectedItem.uid).remove();
    setEditOpen(false);
    setEdit(false);
    setDeleteOpen(false);
  };

  const handleSave = (uid) => {
    setSelectedItem({});
    firebase
      .activity(selectedItem.uid)
      .update({ num_guests: bufferGuests, note: bufferNotes, amount: bufferAmount });
    setEdit(false);
    setEditOpen(false);
    setDeleteOpen(false);
  };

  const handleOpenEdit = () => {
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEdit(false);
    setBufferAmount(amount)
    setBufferGuests(num_guests)
    setBufferNotes(note)
    setEditOpen(false);
  };

  const handleChangeGuests = (event) => {
    setBufferGuests(event.target.value);
  };

  const handleChangeActivityType = (event) => {
    setBufferActivityType(event.target.value);
  };
  const handleChangeNote = (event) => {
  
    setBufferNotes(event.target.value);
  };

  const handleChangeAmount = (event) => {
  
    setBufferAmount(event.target.value);
  };

  // const handleChangeNote = (event) => {
  //   setNote(event.target.value);
  // };

  // const handleChangeDateRange = (event) => {
  //   setDateRange(event.target.value);
  // };

  const handleSelectItem = (event) => {
    setSelectedItem(event.data);
    setBufferGuests(event.data.num_guests);
    setBufferActivityType(event.data.ActivityType);
    setBufferNotes(event.data.note);
    setBufferAmount(event.data.amount);
  };
  const handleRenderEdit = () => {
    setEdit(true);
  };

  // ******************************************
  // *************** MODAL BODY ***************
  // ******************************************

  function getModalStyle() {
    const top = 50;
    const left = 50;

    return {
      top: `${top}%`,
      left: `${left}%`,
      transform: `translate(-${top}%, -${left}%)`,
    };
  }

  const editBody = (
    <div style={modalStyle} className={classes.paper}>
      <h2 id="simple-modal-title">Activity Detail</h2>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            disabled={true}
            id="activity_type"
            label="Activity Type"
            helperText="Cannot edit Activity Type"
            fullWidth
            value={bufferActivityType}
            // onChange={handleChangeActivityType}
          />
        </Grid>
        {(activityType === 'Business Received' ||
          activityType === 'Referral Given') && (
          <Grid item xs={12} md={6}>
            <TextField
            type="number"
              disabled={true}
              id="member"
              label="Member"
              helperText="Cannot edit Member"
              fullWidth
              value={member}
              // onChange={handleChangeNote}
            />
          </Grid>
        )}
        {activityType === 'Business Received' && (
          <Grid item xs={12} md={6}>
            <TextField
              disabled={!edit}
              id="amount"
              label="Amount"
              helperText="Amount of dollars closed"
              fullWidth
              value={bufferAmount}
              onChange={handleChangeAmount}
            />
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <TextField
            disabled={!edit}
            multiline
            rows={4}
            id="notes"
            label="Notes"
            helperText="Notes about your activity"
            fullWidth
            value={bufferNotes}
            onChange={handleChangeNote}
          />
        </Grid>

        {activityType === 'One to One' && (
          <Grid item xs={12} md={6}>
            <TextField
              disabled={!edit}
              id="num_one_to_ones"
              label="# of One to Ones"
              helperText="Number of One to Ones"
              fullWidth
              value={num_one_to_ones}
              // onChange={handleChangeNote}
            />
          </Grid>
        )}
        {activityType === 'Attendance' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                disabled={true}
                id="attendance"
                label="Attendance"
                helperText="Cannot edit Attendance"
                fullWidth
                value={attendance ? 'Present' : 'Absent'}
                // onChange={handleChangeNote}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <InputLabel>Number of Guests</InputLabel>
              <Select
                disabled={!edit}
                value={bufferGuests}
                onChange={handleChangeGuests}
              >
                {numbers.map((value, index) => (
                  <MenuItem key={index} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </Grid>
          </>
        )}

        <Grid item xs={12} md={6}>
          <TextField
          startAdor
          // startAdornment={<InputAdornment position="start">$</InputAdornment>}
            disabled={true}
            id="date"
            label="Date"
            helperText="Cannot Edit Date"
            fullWidth
            value={date}
            // onChange={handleChangeNote}
          />
        </Grid>
        <Grid item xs={12} md={12}>
          {edit ? (
            <Button
              variant="contained"
              onClick={() => handleSave(uid)}
              style={{ backgroundColor: '#309a2f', color: 'white' }}
            >
              Save
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => setEdit(true)}
              color="primary"
            >
              Edit
            </Button>
          )}

          <Button
            disabled={
              selectedItem.activityType === 'Business Given' ||
              selectedItem.activityType === 'Referral Received'
            }
            variant="contained"
            onClick={handleDelete}
            color="secondary"
          >
            Delete
          </Button>
          <Button
            disabled={!selectedItem.activityType}
            variant="contained"
            onClick={handleCloseEdit}
            color="info"
          >
            Cancel
          </Button>
        </Grid>
      </Grid>
    </div>
  );

  useEffect(() => {
    onListenForActivity(authUser.uid);
    onListenForGiven(authUser.uid);
  }, []);

  const calculate = () => {
    if (activities.length > 0) {
      let totalAmountInit = 0;
      let totalAmountGivenInit = 0;
      [...given, ...activities].forEach((a) => {
        if (a.activityType === 'Business Received') {
          totalAmountInit += +a.amount;
        } else {
          totalAmountGivenInit += +a.amount;
        }
      });
      setTotalAmount(totalAmountInit);
      setTotalAmountGiven(totalAmountGivenInit);

      setTotalOneToOnes(
        activities.reduce((a, b) => +a + +b.num_one_to_ones, 0),
      );

      setTotalGuests(
        activities.reduce((a, b) => +a + +b.num_guests, 0),
      );

      setTotalReferrals(
        activities.filter((a) => a.activityType === 'Referral Given')
          .length,
      );
      setTotalAttendance(
        activities.reduce((a, b) => (+a + b.attendance ? 1 : 0), 0),
      );

      setTotalEvents(
        activities.filter(
          (a) => a.activityType === 'Networking Event',
        ).length,
      );
    }
    setFilterModel({
      items: [
        {
          columnField: 'date',
          id: 90144,
          operatorValue: 'onOrAfter',
          value: sevenDays,
        },
      ],
    });
  };

  useEffect(() => {
    setTimeout(() => {
      calculate();
    }, 500);
  }, [activities]);
  return (
    <>
      <div
        style={{ height: 500, width: '100%', marginBottom: '3em' }}
      >
        <DataGrid
          density="compact"
          onFilterModelChange={(props) => {
            let filtered = Array.from(
              props.visibleRows,
              ([name, value]) => ({ ...value }),
            );
            let bufferTotalAmount = 0;
            let bufferTotalAmountGiven = 0;
            let bufferTotalOneToOnes = 0;
            let bufferTotalReferrals = 0;
            let bufferTotalEvents = 0;
            let bufferTotalGuests = 0;
            let bufferTotalAttendance = 0;
            if (filtered) {
              filtered.forEach((a) => {
                if (a.activityType === 'Business Received') {
                  bufferTotalAmount += Number(a.amount);
                }
                if (a.activityType === 'Referral Given') {
                  bufferTotalReferrals += 1;
                }
                if (a.activityType === 'Networking Event') {
                  bufferTotalEvents += 1;
                }
                if (a.activityType === 'Business Given') {
                  bufferTotalAmountGiven += Number(a.amount);
                }
                if (a.activityType === 'One to One') {
                  bufferTotalOneToOnes += Number(a.num_one_to_ones);
                }
                if (a.activityType === 'Attendance') {
                  bufferTotalAttendance += a.attendance ? 1 : 0;
                  bufferTotalGuests += Number(a.num_guests);
                }
              });
              setTotalAmount(bufferTotalAmount);
              setTotalAmountGiven(bufferTotalAmountGiven);
              setTotalOneToOnes(bufferTotalOneToOnes);
              setTotalReferrals(bufferTotalReferrals);
              setTotalEvents(bufferTotalEvents);
              setTotalGuests(bufferTotalGuests);
              setTotalAttendance(bufferTotalAttendance);
            }
          }}
          components={{
            Toolbar: GridToolbar,
          }}
          onRowSelected={handleSelectItem}
          rows={[...activities, ...given]}
          columns={columns}
          pageSize={10}
          getRowId={(row) => row.uid}
          sortModel={sortModel}
          filterModel={filterModel}
          loading={loading}
        />

        <Button
          variant="contained"
          color="secondary"
          onClick={handleOpenDelete}
          disabled={
            !selectedItem.activityType ||
            selectedItem.activityType === 'Business Given' ||
            selectedItem.activityType === 'Referral Received'
          }
        >
          Delete Selected
        </Button>
        <Dialog
          open={deleteOpen}
          onClose={handleCloseDelete}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {'Permanently Delete Activity?'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete this Activity? This
              action is permanent.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="primary" autoFocus>
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        <Button
          disabled={
            !selectedItem.activityType ||
            selectedItem.activityType === 'Business Given' ||
            selectedItem.activityType === 'Referral Received'
          }
          variant="contained"
          onClick={handleOpenEdit}
          color="primary"
        >
          View/Edit Details
        </Button>
        <Modal
          open={openEdit}
          onClose={handleCloseEdit}
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
        >
          {editBody}
        </Modal>
      </div>
      {/* ******************************************
       *************** Totals Table *****************
       ****************************************** */}
      <Typography variant="caption">
        The totals shown below are based on the last 7 days of
        activity unless the filter is changed.
      </Typography>
      {loading && <LinearProgress color="primary" />}
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Total Business Received</TableCell>
              <TableCell>Total Business Given</TableCell>
              <TableCell>Total One to Ones</TableCell>
              <TableCell>Total Referrals Given</TableCell>
              <TableCell>Total Networking Events</TableCell>
              <TableCell>Total Meetings Attended</TableCell>
              <TableCell>Total Guests</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow key={'totalsRow'}>
              <TableCell>
                {currencyFormatter.format(Number(totalAmount))}
              </TableCell>
              <TableCell>
                {currencyFormatter.format(Number(totalAmountGiven))}
              </TableCell>
              <TableCell>{totalOneToOnes}</TableCell>
              <TableCell>{totalReferrals}</TableCell>
              <TableCell>{totalEvents}</TableCell>
              <TableCell>{totalAttendance}</TableCell>
              <TableCell>{totalGuests}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default withFirebase(ActivityTable);
